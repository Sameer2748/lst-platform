use anchor_lang::prelude::*;
use anchor_lang::system_program;
use anchor_spl::token::{self, Mint, Token, TokenAccount, MintTo, Burn};
use anchor_spl::associated_token::AssociatedToken;

declare_id!("AFU3sLSc7vXEEuBbEnZn2R3XnoFXryRaPqDEaoaJri9d");

#[program]
pub mod sam_sol_stake {
    use super::*;

    pub fn initialize_global_authority(ctx: Context<InitializeGlobalAuthority>) -> Result<()> {
        let global_authority = &mut ctx.accounts.global_mint_authority;
        global_authority.bump = ctx.bumps.global_mint_authority;
        msg!("Global mint authority initialized");
        Ok(())
    }

    pub fn create_user_stake_account(ctx: Context<CreateUserStakeAccount>) -> Result<()> {
        let user_stake_account = &mut ctx.accounts.user_stake_account;
        user_stake_account.owner = ctx.accounts.user.key();
        user_stake_account.staked_amount = 0;
        user_stake_account.total_points = 0;
        user_stake_account.last_update_time = Clock::get()?.unix_timestamp;
        user_stake_account.bump = ctx.bumps.user_stake_account;
        msg!("User stake account created successfully");
        Ok(())
    }

    pub fn stake(ctx: Context<Stake>, amount: u64) -> Result<()> {
        require!(amount > 0, StakeError::InvalidAmount);

        let user_stake_account = &mut ctx.accounts.user_stake_account;

        // Transfer SOL from user to user's vault PDA
        let cpi_ctx = CpiContext::new(
            ctx.accounts.system_program.to_account_info(),
            system_program::Transfer {
                from: ctx.accounts.user.to_account_info(),
                to: ctx.accounts.user_vault.to_account_info(),
            },
        );
        system_program::transfer(cpi_ctx, amount)?;

        // Mint SamSOL 1:1 to user's token account using global mint authority
        let seeds = &[b"global_mint_authority".as_ref(), &[ctx.accounts.global_mint_authority.bump]];
        let signer = &[&seeds[..]];

        let cpi_ctx_mint = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            MintTo {
                mint: ctx.accounts.samsol_mint.to_account_info(),
                to: ctx.accounts.user_samsol_token_account.to_account_info(),
                authority: ctx.accounts.global_mint_authority_info.to_account_info(),
            },
            signer,
        );
        token::mint_to(cpi_ctx_mint, amount)?;

        // Update staked amount
        user_stake_account.staked_amount = user_stake_account.staked_amount.checked_add(amount)
            .ok_or(StakeError::Overflow)?;

        msg!("Staked {} lamports and minted {} SamSOL", amount, amount);
        Ok(())
    }

    pub fn unstake(ctx: Context<Unstake>, amount: u64) -> Result<()> {
        require!(amount > 0, StakeError::InvalidAmount);
        let user_stake_account = &mut ctx.accounts.user_stake_account;
        require!(user_stake_account.staked_amount >= amount, StakeError::InsufficientStake);

        // Burn SamSOL from user's token account
        let cpi_ctx_burn = CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            Burn {
                mint: ctx.accounts.samsol_mint.to_account_info(),
                from: ctx.accounts.user_samsol_token_account.to_account_info(),
                authority: ctx.accounts.user.to_account_info(),
            },
        );
        token::burn(cpi_ctx_burn, amount)?;

        // Transfer SOL from user's vault PDA back to user
        // Find the correct bump for user_vault
        let user_key = ctx.accounts.user.key();
        let (_vault_pda, vault_bump) = Pubkey::find_program_address(
            &[b"user_vault", user_key.as_ref()],
            ctx.program_id,
        );
        
        let seeds = &[b"user_vault", user_key.as_ref(), &[vault_bump]];
        let signer = &[&seeds[..]];

        let cpi_ctx_transfer = CpiContext::new_with_signer(
            ctx.accounts.system_program.to_account_info(),
            system_program::Transfer {
                from: ctx.accounts.user_vault.to_account_info(),
                to: ctx.accounts.user.to_account_info(),
            },
            signer,
        );
        system_program::transfer(cpi_ctx_transfer, amount)?;

        // Update staked amount
        user_stake_account.staked_amount = user_stake_account.staked_amount.checked_sub(amount)
            .ok_or(StakeError::Underflow)?;

        msg!("Unstaked {} lamports and burned {} SamSOL", amount, amount);
        Ok(())
    }
}

#[account]
pub struct UserStakeAccount {
    pub owner: Pubkey,
    pub staked_amount: u64,
    pub total_points: u64,
    pub last_update_time: i64,
    pub bump: u8,
}

#[account]
pub struct GlobalMintAuthority {
    pub bump: u8,
}

#[derive(Accounts)]
pub struct InitializeGlobalAuthority<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,

    #[account(
        init,
        payer = payer,
        space = 8 + 1,
        seeds = [b"global_mint_authority"],
        bump
    )]
    pub global_mint_authority: Account<'info, GlobalMintAuthority>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct CreateUserStakeAccount<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    #[account(
        init,
        payer = user,
        space = 8 + 32 + 8 + 8 + 8 + 1,
        seeds = [b"user_stake", user.key().as_ref()],
        bump
    )]
    pub user_stake_account: Account<'info, UserStakeAccount>,

    /// CHECK: User vault PDA - will be created by system program when first SOL is transferred
    #[account(
        mut,
        seeds = [b"user_vault", user.key().as_ref()],
        bump
    )]
    pub user_vault: AccountInfo<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Stake<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    #[account(
        mut,
        seeds = [b"user_stake", user.key().as_ref()],
        bump = user_stake_account.bump,
        constraint = user_stake_account.owner == user.key() @ StakeError::Unauthorized
    )]
    pub user_stake_account: Account<'info, UserStakeAccount>,

    /// CHECK: User vault PDA for storing SOL
    #[account(
        mut,
        seeds = [b"user_vault", user.key().as_ref()],
        bump
    )]
    pub user_vault: AccountInfo<'info>,

    #[account(
        seeds = [b"global_mint_authority"],
        bump = global_mint_authority.bump
    )]
    pub global_mint_authority: Account<'info, GlobalMintAuthority>,

    /// CHECK: Global mint authority PDA as AccountInfo for minting
    #[account(seeds = [b"global_mint_authority"], bump = global_mint_authority.bump)]
    pub global_mint_authority_info: AccountInfo<'info>,

    #[account(mut)]
    pub samsol_mint: Account<'info, Mint>,

    #[account(
        mut,
        associated_token::mint = samsol_mint,
        associated_token::authority = user
    )]
    pub user_samsol_token_account: Account<'info, TokenAccount>,

    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
}

#[derive(Accounts)]
pub struct Unstake<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    #[account(
        mut,
        seeds = [b"user_stake", user.key().as_ref()],
        bump = user_stake_account.bump,
        constraint = user_stake_account.owner == user.key() @ StakeError::Unauthorized
    )]
    pub user_stake_account: Account<'info, UserStakeAccount>,

    /// CHECK: User vault PDA for storing SOL
    #[account(
        mut,
        seeds = [b"user_vault", user.key().as_ref()],
        bump
    )]
    pub user_vault: AccountInfo<'info>,

    #[account(
        seeds = [b"global_mint_authority"],
        bump = global_mint_authority.bump
    )]
    pub global_mint_authority: Account<'info, GlobalMintAuthority>,

    #[account(mut)]
    pub samsol_mint: Account<'info, Mint>,

    #[account(
        mut,
        associated_token::mint = samsol_mint,
        associated_token::authority = user
    )]
    pub user_samsol_token_account: Account<'info, TokenAccount>,

    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
}

#[error_code]
pub enum StakeError {
    #[msg("Amount must be greater than 0")]
    InvalidAmount,
    #[msg("Insufficient staked amount")]
    InsufficientStake,
    #[msg("Unauthorized access")]
    Unauthorized,
    #[msg("Arithmetic overflow")]
    Overflow,
    #[msg("Arithmetic underflow")]
    Underflow,
}