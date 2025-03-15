import * as anchor from '@coral-xyz/anchor'
import { Program } from '@coral-xyz/anchor'
import { Keypair } from '@solana/web3.js'
import { Escrow } from '../target/types/escrow'

describe('escrow', () => {
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env()
  anchor.setProvider(provider)
  const payer = provider.wallet as anchor.Wallet

  const program = anchor.workspace.Escrow as Program<Escrow>

  const escrowKeypair = Keypair.generate()

  it('Initialize Escrow', async () => {
    await program.methods
      .initialize()
      .accounts({
        escrow: escrowKeypair.publicKey,
        payer: payer.publicKey,
      })
      .signers([escrowKeypair])
      .rpc()

    const currentCount = await program.account.escrow.fetch(escrowKeypair.publicKey)

    expect(currentCount.count).toEqual(0)
  })

  it('Increment Escrow', async () => {
    await program.methods.increment().accounts({ escrow: escrowKeypair.publicKey }).rpc()

    const currentCount = await program.account.escrow.fetch(escrowKeypair.publicKey)

    expect(currentCount.count).toEqual(1)
  })

  it('Increment Escrow Again', async () => {
    await program.methods.increment().accounts({ escrow: escrowKeypair.publicKey }).rpc()

    const currentCount = await program.account.escrow.fetch(escrowKeypair.publicKey)

    expect(currentCount.count).toEqual(2)
  })

  it('Decrement Escrow', async () => {
    await program.methods.decrement().accounts({ escrow: escrowKeypair.publicKey }).rpc()

    const currentCount = await program.account.escrow.fetch(escrowKeypair.publicKey)

    expect(currentCount.count).toEqual(1)
  })

  it('Set escrow value', async () => {
    await program.methods.set(42).accounts({ escrow: escrowKeypair.publicKey }).rpc()

    const currentCount = await program.account.escrow.fetch(escrowKeypair.publicKey)

    expect(currentCount.count).toEqual(42)
  })

  it('Set close the escrow account', async () => {
    await program.methods
      .close()
      .accounts({
        payer: payer.publicKey,
        escrow: escrowKeypair.publicKey,
      })
      .rpc()

    // The account should no longer exist, returning null.
    const userAccount = await program.account.escrow.fetchNullable(escrowKeypair.publicKey)
    expect(userAccount).toBeNull()
  })
})
