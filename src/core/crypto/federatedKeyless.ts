// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { AccountPublicKey, PublicKey } from "./publicKey";
import { Hex } from "../hex";
import { HexInput, AnyPublicKeyVariant, SigningScheme } from "../../types";
import { AuthenticationKey } from "../authenticationKey";
import { AccountAddress, AccountAddressInput } from "../accountAddress";
import { KeylessPublicKey, KeylessSignature } from "./keyless";
import { Serializer } from "../../bcs/serializer";
import { Deserializer } from "../../bcs/deserializer";

/**
 * Represents the FederatedKeylessPublicKey public key
 *
 * These keys use an onchain address as a source of truth for the JWK used to verify signatures.
 *
 * FederatedKeylessPublicKey authentication key is represented in the SDK as `AnyPublicKey`.
 */
export class FederatedKeylessPublicKey extends AccountPublicKey {
  /**
   * The address that contains the JWK set to be used for verification.
   */
  readonly jwkAddress: AccountAddress;

  /**
   * The inner public key which contains the standard Keyless public key.
   */
  readonly keylessPublicKey: KeylessPublicKey;

  constructor(jwkAddress: AccountAddressInput, keylessPublicKey: KeylessPublicKey) {
    super();
    this.jwkAddress = AccountAddress.from(jwkAddress);
    this.keylessPublicKey = keylessPublicKey;
  }

  /**
   * Get the authentication key for the federated keyless public key
   *
   * @returns AuthenticationKey
   */
  authKey(): AuthenticationKey {
    const serializer = new Serializer();
    serializer.serializeU32AsUleb128(AnyPublicKeyVariant.FederatedKeyless);
    serializer.serializeFixedBytes(this.bcsToBytes());
    return AuthenticationKey.fromSchemeAndBytes({
      scheme: SigningScheme.SingleKey,
      input: serializer.toUint8Array(),
    });
  }

  /**
   * Get the public key in bytes (Uint8Array).
   *
   * @returns Uint8Array representation of the public key
   */
  toUint8Array(): Uint8Array {
    return this.bcsToBytes();
  }

  /**
   * Get the public key as a hex string with the 0x prefix.
   *
   * @returns string representation of the public key
   */
  toString(): string {
    return Hex.fromHexInput(this.toUint8Array()).toString();
  }

  /**
   * Verifies a signed data with a public key
   *
   * @param args.message message
   * @param args.signature The signature
   * @returns true if the signature is valid
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars, class-methods-use-this
  verifySignature(args: { message: HexInput; signature: KeylessSignature }): boolean {
    throw new Error("Not yet implemented");
  }

  serialize(serializer: Serializer): void {
    this.jwkAddress.serialize(serializer);
    this.keylessPublicKey.serialize(serializer);
  }

  static deserialize(deserializer: Deserializer): FederatedKeylessPublicKey {
    const jwkAddress = AccountAddress.deserialize(deserializer);
    const keylessPublicKey = KeylessPublicKey.deserialize(deserializer);
    return new FederatedKeylessPublicKey(jwkAddress, keylessPublicKey);
  }

  static isPublicKey(publicKey: PublicKey): publicKey is FederatedKeylessPublicKey {
    return publicKey instanceof FederatedKeylessPublicKey;
  }

  /**
   * Creates a FederatedKeylessPublicKey from the JWT components plus pepper
   *
   * @param args.iss the iss of the identity
   * @param args.uidKey the key to use to get the uidVal in the JWT token
   * @param args.uidVal the value of the uidKey in the JWT token
   * @param args.aud the client ID of the application
   * @param args.pepper The pepper used to maintain privacy of the account
   * @returns FederatedKeylessPublicKey
   */
  static create(args: {
    iss: string;
    uidKey: string;
    uidVal: string;
    aud: string;
    pepper: HexInput;
    jwkAddress: AccountAddressInput;
  }): FederatedKeylessPublicKey {
    return new FederatedKeylessPublicKey(args.jwkAddress, KeylessPublicKey.create(args));
  }

  static fromJwtAndPepper(args: {
    jwt: string;
    pepper: HexInput;
    jwkAddress: AccountAddressInput;
    uidKey?: string;
  }): FederatedKeylessPublicKey {
    return new FederatedKeylessPublicKey(args.jwkAddress, KeylessPublicKey.fromJwtAndPepper(args));
  }

  static isInstance(publicKey: PublicKey) {
    return (
      "jwkAddress" in publicKey &&
      publicKey.jwkAddress instanceof AccountAddress &&
      "keylessPublicKey" in publicKey &&
      publicKey.keylessPublicKey instanceof KeylessPublicKey
    );
  }
}