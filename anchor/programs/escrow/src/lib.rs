#![allow(clippy::result_large_err)]
#![allow(unexpected_cfgs)]
use crate::instructions::*;
use anchor_lang::prelude::*;
pub mod instructions;
pub mod states;

declare_id!("coUnmi3oBUtwtd9fjeAvSsJssXh5A5xyPbhpewyzRVF");

#[program]
pub mod escrow {
    use super::*;

    pub fn make_offer(ctx: Context<Make>, seed: u64, amount: u64) -> Result<()> {
        ctx.accounts.init_escrow(seed, amount, &ctx.bumps)?;
        ctx.accounts.deposit(amount)?;
        Ok(())
    }
}
