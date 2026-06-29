#[test_only]
module chopsui::game_tests {
    use sui::test_scenario::{Self, next_tx, ctx};
    use sui::coin;
    use sui::sui::SUI;
    use chopsui::game::{Self, GameState};

    const OWNER: address = @0xA;
    const PLAYER: address = @0xB;
    const TREASURY: address = @0xC;

    // ======== Test 1: GameState initialized correctly ========
    #[test]
    fun test_init_creates_game_state() {
        let mut scenario = test_scenario::begin(OWNER);
        {
            game::init_for_testing(ctx(&mut scenario));
        };

        next_tx(&mut scenario, OWNER);
        {
            let game_state = test_scenario::take_shared<GameState>(&scenario);
            assert!(game::get_collected_fees(&game_state) == 0, 0);
            assert!(game::get_treasury_address(&game_state) == OWNER, 1);
            test_scenario::return_shared(game_state);
        };

        scenario.end();
    }

    // ======== Test 2: Player pays correct amount ========
    #[test]
    fun test_pay_sui_success() {
        let mut scenario = test_scenario::begin(OWNER);
        {
            game::init_for_testing(ctx(&mut scenario));
        };

        next_tx(&mut scenario, PLAYER);
        {
            let mut game_state = test_scenario::take_shared<GameState>(&scenario);
            let cost: u64 = 1_000_000_000;
            let payment = coin::mint_for_testing<SUI>(cost, ctx(&mut scenario));

            game::paySUI(
                &mut game_state,
                payment,
                b"test.jwt.token",
                1000000,
                cost,
                ctx(&mut scenario)
            );

            assert!(game::get_collected_fees(&game_state) == cost, 0);
            test_scenario::return_shared(game_state);
        };

        scenario.end();
    }

    // ======== Test 3: Wrong payment amount fails ========
    #[test, expected_failure(abort_code = ::chopsui::game::EInvalidPaymentAmount)]
    fun test_pay_sui_wrong_amount_fails() {
        let mut scenario = test_scenario::begin(OWNER);
        {
            game::init_for_testing(ctx(&mut scenario));
        };

        next_tx(&mut scenario, PLAYER);
        {
            let mut game_state = test_scenario::take_shared<GameState>(&scenario);
            let payment = coin::mint_for_testing<SUI>(500, ctx(&mut scenario));

            game::paySUI(
                &mut game_state,
                payment,
                b"fake.jwt",
                1000,
                1_000_000_000,
                ctx(&mut scenario)
            );

            test_scenario::return_shared(game_state);
        };

        scenario.end();
    }

    // ======== Test 4: Owner updates treasury address ========
    #[test]
    fun test_update_treasury_address() {
        let mut scenario = test_scenario::begin(OWNER);
        {
            game::init_for_testing(ctx(&mut scenario));
        };

        next_tx(&mut scenario, OWNER);
        {
            let mut game_state = test_scenario::take_shared<GameState>(&scenario);
            game::update_treasury_address(&mut game_state, TREASURY, ctx(&mut scenario));
            assert!(game::get_treasury_address(&game_state) == TREASURY, 0);
            test_scenario::return_shared(game_state);
        };

        scenario.end();
    }

    // ======== Test 5: Non-owner cannot update treasury ========
    #[test, expected_failure(abort_code = ::chopsui::game::ENotAuthorized)]
    fun test_update_treasury_unauthorized_fails() {
        let mut scenario = test_scenario::begin(OWNER);
        {
            game::init_for_testing(ctx(&mut scenario));
        };

        next_tx(&mut scenario, PLAYER);
        {
            let mut game_state = test_scenario::take_shared<GameState>(&scenario);
            game::update_treasury_address(&mut game_state, TREASURY, ctx(&mut scenario));
            test_scenario::return_shared(game_state);
        };

        scenario.end();
    }

    // ======== Test 6: transfer_to_treasury fails with empty public key ========
    #[test, expected_failure(abort_code = ::chopsui::game::EInvalidSignature)]
    fun test_transfer_to_treasury_empty_key_fails() {
        let mut scenario = test_scenario::begin(OWNER);
        {
            game::init_for_testing(ctx(&mut scenario));
        };

        next_tx(&mut scenario, OWNER);
        {
            let mut game_state = test_scenario::take_shared<GameState>(&scenario);
            game::transfer_to_treasury(
                &mut game_state,
                b"fake_sig",
                b"fake_msg",
                ctx(&mut scenario)
            );
            test_scenario::return_shared(game_state);
        };

        scenario.end();
    }
}