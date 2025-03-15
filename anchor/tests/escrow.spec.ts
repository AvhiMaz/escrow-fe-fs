import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Keypair, LAMPORTS_PER_SOL } from "@solana/web3.js";
import {
  TOKEN_PROGRAM_ID,
  createMint,
  createAccount,
  mintTo,
  getAccount,
} from "@solana/spl-token";
import { Escrow } from "../target/types/escrow";

describe("escrow", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.Escrow as Program<Escrow>;

  let mintA: anchor.web3.PublicKey;
  let mintB: anchor.web3.PublicKey;
  let makerAtaA: anchor.web3.PublicKey;
  let makerAtaB: anchor.web3.PublicKey;
  let takerAtaA: anchor.web3.PublicKey;
  let takerAtaB: anchor.web3.PublicKey;
  let vault: anchor.web3.PublicKey;
  let escrow: anchor.web3.PublicKey;

  const maker = Keypair.generate();
  const taker = Keypair.generate();
  const seed = new anchor.BN(1);
  const depositAmount = new anchor.BN(50);

  beforeAll(async () => {
    const makerAirdrop = await provider.connection.requestAirdrop(
      maker.publicKey,
      10 * LAMPORTS_PER_SOL
    );
    const takerAirdrop = await provider.connection.requestAirdrop(
      taker.publicKey,
      10 * LAMPORTS_PER_SOL
    );

    const latestBlockhash = await provider.connection.getLatestBlockhash();
    await provider.connection.confirmTransaction({
      signature: makerAirdrop,
      blockhash: latestBlockhash.blockhash,
      lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
    });
    await provider.connection.confirmTransaction({
      signature: takerAirdrop,
      blockhash: latestBlockhash.blockhash,
      lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
    });

    mintA = await createMint(
      provider.connection,
      maker,
      maker.publicKey,
      null,
      6
    );
    mintB = await createMint(
      provider.connection,
      taker,
      taker.publicKey,
      null,
      6
    );
    console.log("Mint A:", mintA.toString());
    console.log("Mint B:", mintB.toString());

    makerAtaA = await createAccount(
      provider.connection,
      maker,
      mintA,
      maker.publicKey
    );
    makerAtaB = await createAccount(
      provider.connection,
      maker,
      mintB,
      maker.publicKey
    );
    takerAtaA = await createAccount(
      provider.connection,
      taker,
      mintA,
      taker.publicKey
    );
    takerAtaB = await createAccount(
      provider.connection,
      taker,
      mintB,
      taker.publicKey
    );

    await mintTo(provider.connection, maker, mintA, makerAtaA, maker, 1000);
    await mintTo(provider.connection, taker, mintB, takerAtaB, taker, 1000);

    [escrow] = anchor.web3.PublicKey.findProgramAddressSync(
      [
        Buffer.from("escrow"),
        maker.publicKey.toBuffer(),
        seed.toBuffer("le", 8),
      ],
      program.programId
    );

    vault = anchor.utils.token.associatedAddress({
      mint: mintA,
      owner: escrow,
    });

    const makerInitialBalance = await getAccount(
      provider.connection,
      makerAtaA
    );
    const takerInitialBalance = await getAccount(
      provider.connection,
      takerAtaB
    );
  });

  it("Makes escrow offer", async () => {
    await program.methods
      .makeOffer(seed, depositAmount)
      .accounts({
        maker: maker.publicKey,
        mintA,
        mintB,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .signers([maker])
      .rpc();

    const escrowAccount = await program.account.escrow.fetch(escrow);
    console.log("Escrow account data:", {
      maker: escrowAccount.maker.toString(),
      mintA: escrowAccount.mintA.toString(),
      mintB: escrowAccount.mintB.toString(),
      receiveAmount: escrowAccount.receiveAmount.toString(),
    });

    expect(escrowAccount.maker.equals(maker.publicKey));
    expect(escrowAccount.mintA.equals(mintA));
    expect(escrowAccount.mintB.equals(mintB));
    expect(escrowAccount.receiveAmount.eq(depositAmount));

    const vaultAccount = await getAccount(provider.connection, vault);
    console.log("Vault balance:", vaultAccount.amount.toString());
    expect(vaultAccount.amount === BigInt(depositAmount.toString()));

    const makerBalanceAfterDeposit = await getAccount(
      provider.connection,
      makerAtaA
    );
    console.log(makerBalanceAfterDeposit.amount.toString());
  });
});
