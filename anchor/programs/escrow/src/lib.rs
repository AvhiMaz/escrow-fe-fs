#![allow(clippy::result_large_err)]

use anchor_lang::prelude::*;

declare_id!("coUnmi3oBUtwtd9fjeAvSsJssXh5A5xyPbhpewyzRVF");

#[program]
pub mod escrow {
    use super::*;

  pub fn close(_ctx: Context<CloseEscrow>) -> Result<()> {
    Ok(())
  }

  pub fn decrement(ctx: Context<Update>) -> Result<()> {
    ctx.accounts.escrow.count = ctx.accounts.escrow.count.checked_sub(1).unwrap();
    Ok(())
  }

  pub fn increment(ctx: Context<Update>) -> Result<()> {
    ctx.accounts.escrow.count = ctx.accounts.escrow.count.checked_add(1).unwrap();
    Ok(())
  }

  pub fn initialize(_ctx: Context<InitializeEscrow>) -> Result<()> {
    Ok(())
  }

  pub fn set(ctx: Context<Update>, value: u8) -> Result<()> {
    ctx.accounts.escrow.count = value.clone();
    Ok(())
  }
}

#[derive(Accounts)]
pub struct InitializeEscrow<'info> {
  #[account(mut)]
  pub payer: Signer<'info>,

  #[account(
  init,
  space = 8 + Escrow::INIT_SPACE,
  payer = payer
  )]
  pub escrow: Account<'info, Escrow>,
  pub system_program: Program<'info, System>,
}
#[derive(Accounts)]
pub struct CloseEscrow<'info> {
  #[account(mut)]
  pub payer: Signer<'info>,

  #[account(
  mut,
  close = payer, // close account and return lamports to payer
  )]
  pub escrow: Account<'info, Escrow>,
}

#[derive(Accounts)]
pub struct Update<'info> {
  #[account(mut)]
  pub escrow: Account<'info, Escrow>,
}

#[account]
#[derive(InitSpace)]
pub struct Escrow {
  count: u8,
}
