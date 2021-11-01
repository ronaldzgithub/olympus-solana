import { useMemo, useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import {
  Box,
  Paper,
  Typography,
  Button,
  Zoom,
  OutlinedInput,
  InputAdornment,
  InputLabel,
} from "@material-ui/core";
import { Skeleton } from "@material-ui/lab";
import styled from 'styled-components';
import { sign } from 'tweetnacl';
import bs58 from 'bs58';

import useMediaQuery from "@material-ui/core/useMediaQuery";
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { Keypair, LAMPORTS_PER_SOL, PublicKey, SystemProgram, Transaction } from '@solana/web3.js';
import { createKeypairFromFile } from "src/utils/contract";

export default function Addresses() {
  const { publicKey, connected } = useWallet();
  const { connection } = useConnection();
  const [walletChecked, setWalletChecked] = useState(false);
  const isSmallScreen = useMediaQuery("(max-width: 705px)");
  const [quantity, setQuantity] = useState("");
  const [programId, setProgramId] = useState()

  // this useEffect fires on state change from above. It will ALWAYS fire AFTER
  useEffect(() => {
    // don't load ANY details until wallet is Checked
    handleSetProgramId()
  }, [walletChecked]);

  const handleSetProgramId = async () => {
    const programKeypair = await createKeypairFromFile();
    setProgramId(programKeypair.publicKey);
  }

  const balance = useMemo(async () => {
    if (connection && publicKey) {
      const tmp = await connection.getBalance(publicKey)
      return tmp
    }
  }, [connection, publicKey])

  const handleAddAddress = async () => {
    // Airdrop SOL for paying transactions
    let payer = Keypair.generate();

    let airdropSignature = await connection.requestAirdrop(
      payer.publicKey,
      LAMPORTS_PER_SOL,
    );

    await connection.confirmTransaction(airdropSignature);

    // Allocate Account Data
    let allocatedAccount = Keypair.generate();
    let allocateInstruction = SystemProgram.allocate({
      accountPubkey: allocatedAccount.publicKey,
      space: 100,
    })
    let transaction = new Transaction().add(allocateInstruction);

    await sendAndConfirmTransaction(connection, transaction, [payer, allocatedAccount])

    // Create Nonce Account
    let nonceAccount = Keypair.generate();
    let minimumAmountForNonceAccount = await connection.getMinimumBalanceForRentExemption(
      NONCE_ACCOUNT_LENGTH,
    );
    let createNonceAccountTransaction = new Transaction().add(
      SystemProgram.createNonceAccount({
        fromPubkey: payer.publicKey,
        noncePubkey: nonceAccount.publicKey,
        authorizedPubkey: payer.publicKey,
        lamports: minimumAmountForNonceAccount,
      }),
    );

    await sendAndConfirmTransaction(connection, createNonceAccountTransaction, [payer, nonceAccount])

    // Advance nonce - Used to create transactions as an account custodian
    let advanceNonceTransaction = new Transaction().add(
      SystemProgram.nonceAdvance({
        noncePubkey: nonceAccount.publicKey,
        authorizedPubkey: payer.publicKey,
      }),
    );

    await sendAndConfirmTransaction(connection, advanceNonceTransaction, [payer])

    // Transfer lamports between accounts
    let toAccount = Keypair.generate();

    let transferTransaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: payer.publicKey,
        toPubkey: toAccount.publicKey,
        lamports: 1000,
      }),
    );
    await sendAndConfirmTransaction(connection, transferTransaction, [payer])

    // Assign a new account to a program
    let programId = Keypair.generate();
    let assignedAccount = Keypair.generate();

    let assignTransaction = new Transaction().add(
      SystemProgram.assign({
        accountPubkey: assignedAccount.publicKey,
        programId: programId.publicKey,
      }),
    );

    await sendAndConfirmTransaction(connection, assignTransaction, [payer, assignedAccount]);
  }

  return (
    <Zoom in={true}>
      <Paper className={`ohm-card secondary ${isSmallScreen && "mobile"}`}>
        <div className="card-header">
          <Typography variant="h5">Address Book</Typography>
        </div>
        <div className="card-content">
          {!connected ?
            <>
              <Typography variant="h4">
                <Skeleton width='150px' />
              </Typography>
            </>
            :
            <>
              <StyledContainer mt={1}>
                <InputLabel htmlFor="amount-input"></InputLabel>
                <OutlinedInput
                  id="amount-input"
                  type="text"
                  placeholder="Enter an address"
                  className="stake-input"
                  value={quantity}
                  onChange={e => setQuantity(e.target.value)}
                  labelWidth={0}
                />
                <Button variant='contained' color='primary' onClick={handleAddAddress}>
                  Add address
                </Button>
              </StyledContainer>
            </>
          }
        </div>
      </Paper>
    </Zoom>
  );
}

const AddressContainer = styled(Box)`
  >div:first-of-type {
    width: 100%;
  }
`

const StyledContainer = styled(Box)`
  display: flex;
  flex-direction: column;
  @media (min-width:513px) {
    flex-direction: row;
  }
  align-items: center;
  >div:first-of-type {
    flex: auto;
    margin-right: 0px;
    margin-bottom: 7px;
    @media (min-width:513px) {
      flex: 1;
      margin-right: 14px;
      margin-bottom: 0px;
    }
  }
`