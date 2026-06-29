module chopsui::game;

use sui::balance::{Self, Balance};
use sui::coin::{Self, Coin};
use sui::ed25519;
use sui::event;
use sui::sui::SUI;
use std::string::String;

// ======== Errors ========
const EInvalidPaymentAmount: u64 = 0;
const ENotAuthorized: u64 = 1;
const EInvalidTreasuryAddress: u64 = 2;
const EInvalidSignature: u64 = 3;

// ======== Events ========
public struct PaidToContract has copy, drop {
    player: address,
    amount: u64,
    timestamp: u64,
}

public struct TreasuryAddressUpdated has copy, drop {
    old_address: address,
    new_address: address,
}

public struct PublicKeyUpdated has copy, drop {
    old_key: vector<u8>,
    new_key: vector<u8>,
}

public struct TreasuryTransfer has copy, drop {
    amount: u64,
    treasury_address: address,
}
// Define the event to log the generated message
public struct PaymentMessageEvent has copy, drop {
    message: String,
}

// ======== Storage ========

// Add to GameState struct
public struct GameState has key {
    id: UID,
    treasury_address: address,
    collected_fees: Balance<SUI>,
    owner: address,
    public_key: vector<u8>, // Added field for signature verification
}

// ======== Functions ========
fun init(ctx: &mut TxContext) {
    let owner = tx_context::sender(ctx);

    let game_state = GameState {
        id: object::new(ctx),
        treasury_address: owner,
        collected_fees: balance::zero(),
        owner,
        public_key: vector[],
    };

    transfer::share_object(game_state);
}

#[test_only]
public fun init_for_testing(ctx: &mut TxContext) {
    init(ctx)
}

// New function to add power-ups
public fun paySUI(
    game_state: &mut GameState,
    payment: Coin<SUI>,
    message: String,
    timestamp: u64,
    cost: u64,
    ctx: &mut TxContext,
) {
    event::emit(PaymentMessageEvent { message: message });

    // Process payment
    let payment_amount = coin::value(&payment);
    assert!(payment_amount == cost, EInvalidPaymentAmount);

    let payment_balance = coin::into_balance(payment);
    balance::join(&mut game_state.collected_fees, payment_balance);

    // Emit power-up purchase event
    event::emit(PaidToContract {
        player: tx_context::sender(ctx),
        amount: payment_amount,
        timestamp,
    });
}

// New function to set/update public key
public fun update_public_key(
    game_state: &mut GameState,
    new_public_key: vector<u8>,
    ctx: &mut TxContext,
) {
    assert!(tx_context::sender(ctx) == game_state.owner, ENotAuthorized);
    let old_key = game_state.public_key;
    game_state.public_key = new_public_key;

    event::emit(PublicKeyUpdated {
        old_key,
        new_key: new_public_key,
    });
}

// Update treasury address (admin only)
public fun update_treasury_address(
    game_state: &mut GameState,
    new_treasury: address,
    ctx: &mut TxContext,
) {
    assert!(tx_context::sender(ctx) == game_state.owner, ENotAuthorized);
    assert!(new_treasury != @0x0, EInvalidTreasuryAddress);

    let old_address = game_state.treasury_address;
    game_state.treasury_address = new_treasury;

    event::emit(TreasuryAddressUpdated {
        old_address,
        new_address: new_treasury,
    });
}

// Transfer collected fees to treasury
public fun transfer_to_treasury(
    game_state: &mut GameState,
    signature: vector<u8>,
    message: vector<u8>,
    ctx: &mut TxContext,
) {
    assert!(vector::length(&game_state.public_key) > 0, EInvalidSignature);

    // Verify signature
    assert!(
        ed25519::ed25519_verify(&signature, &game_state.public_key, &message),
        EInvalidSignature,
    );

    let amount = balance::value(&game_state.collected_fees);
    assert!(amount > 0, EInvalidPaymentAmount);

    let treasury_coin = coin::from_balance(
        balance::split(&mut game_state.collected_fees, amount),
        ctx,
    );

    transfer::public_transfer(treasury_coin, game_state.treasury_address);

    event::emit(TreasuryTransfer {
        amount,
        treasury_address: game_state.treasury_address,
    });
}

// ======== View Functions ========
public fun get_treasury_address(game_state: &GameState): address {
    game_state.treasury_address
}

public fun get_collected_fees(game_state: &GameState): u64 {
    balance::value(&game_state.collected_fees)
}
