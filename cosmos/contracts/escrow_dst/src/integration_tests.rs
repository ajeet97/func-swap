#[cfg(test)]
mod tests {
    use crate::helpers::CwTemplateContract;
    use crate::msg::{ExecuteMsg, Immutables, InstantiateMsg, QueryMsg, Timelocks};
    use cosmwasm_std::testing::MockApi;
    use cosmwasm_std::{Addr, Coin, Empty, Uint128};
    use cw_multi_test::{App, AppBuilder, Contract, ContractWrapper, Executor};
    use sha2::{Digest, Sha256};

    pub fn contract_template() -> Box<dyn Contract<Empty>> {
        let contract = ContractWrapper::new(
            crate::contract::execute,
            crate::contract::instantiate,
            crate::contract::query,
        );
        Box::new(contract)
    }

    const MAKER: &str = "MAKER";
    const TAKER: &str = "TAKER";
    const PUBLIC: &str = "PUBLIC";
    const NATIVE_DENOM: &str = "stake";

    fn users() -> (Addr, Addr, Addr) {
        (
            MockApi::default().addr_make(MAKER),
            MockApi::default().addr_make(TAKER),
            MockApi::default().addr_make(PUBLIC),
        )
    }

    fn mock_app() -> App {
        let (maker, _taker, _public) = users();

        AppBuilder::new().build(|router, _, storage| {
            router
                .bank
                .init_balance(
                    storage,
                    &maker,
                    vec![
                        Coin {
                            denom: NATIVE_DENOM.to_string(),
                            amount: Uint128::new(1000000000),
                        },
                        Coin {
                            denom: "xyz".into(),
                            amount: Uint128::new(1000000000),
                        },
                    ],
                )
                .unwrap();
        })
    }

    fn setup() -> (App, u64) {
        let mut app = mock_app();
        let code_id = app.store_code(contract_template());
        (app, code_id)
    }

    fn setup_contract() -> (App, CwTemplateContract, String, Immutables) {
        let (maker, taker, _public) = users();
        let (mut app, code_id) = setup();

        let secret: String = "abcd".into();
        let msg = InstantiateMsg {
            rescue_delay: 600,
            immutables: Immutables {
                order_hash: "order_1".into(),
                hashlock: format!("{:x}", Sha256::digest(&secret)),
                maker: maker.clone(),
                taker: taker.clone(),
                coin: cw20::Balance::from(vec![Coin::new(1000000u128, "stake")]),
                safety_deposit: Uint128::new(1000),
                timelocks: Timelocks::new(
                    app.block_info().time.seconds() as u32,
                    30u32,  // .5 minutes, public withdrawal (2x) = 1 minute
                    120u32, // 2 minutes
                    30u32,
                    120u32,
                ),
            },
        };

        let addr = app
            .instantiate_contract(
                code_id,
                maker.clone(),
                &msg,
                &[Coin::new(1001000u128, "stake")],
                "test",
                None,
            )
            .unwrap();

        (app, CwTemplateContract(addr), secret, msg.immutables)
    }

    #[test]
    fn init() {
        let (maker, taker, _public) = users();
        let (mut app, code_id) = setup();

        let secret: String = "abcd".into();
        let mut msg = InstantiateMsg {
            rescue_delay: 600,
            immutables: Immutables {
                order_hash: "order_1".into(),
                hashlock: format!("{:x}", Sha256::digest(secret)),
                maker: maker.clone(),
                taker: taker.clone(),
                coin: cw20::Balance::from(vec![Coin::new(1000000u128, "stake")]),
                safety_deposit: Uint128::new(1000),
                timelocks: Timelocks {
                    dst: Uint128::new(138972037433247551493660541946142130176),
                    src: Uint128::new(0),
                },
            },
        };

        let maker_bal_before = balance(&app, &maker);

        // valid msg
        let mut result = app.instantiate_contract(
            code_id,
            maker.clone(),
            &msg,
            &[Coin::new(1001000u128, "stake")],
            "test",
            None,
        );
        assert_eq!(result.is_ok(), true);

        let maker_bal_after = balance(&app, &maker);
        assert_eq!(maker_bal_before - maker_bal_after, Uint128::new(1001000));

        // insufficient safety deposit
        let err = app
            .instantiate_contract(
                code_id,
                maker.clone(),
                &msg,
                &[Coin::new(100u128, "stake")],
                "test",
                None,
            )
            .unwrap_err();

        assert_eq!(err.root_cause().to_string(), "InsufficientFunds");

        // insufficient order funds
        let mut err = app
            .instantiate_contract(
                code_id,
                maker.clone(),
                &msg,
                &[Coin::new(10000u128, "stake")],
                "test",
                None,
            )
            .unwrap_err();

        assert_eq!(err.root_cause().to_string(), "InsufficientFunds");

        // invalid coin
        msg.immutables.coin =
            cw20::Balance::from(vec![Coin::new(1000u128, "xyz"), Coin::new(1000u128, "abc")]);
        err = app
            .instantiate_contract(
                code_id,
                maker.clone(),
                &msg,
                &[Coin::new(1000u128, "stake")],
                "test",
                None,
            )
            .unwrap_err();
        assert_eq!(err.root_cause().to_string(), "InvalidCoin");

        // non native denom order
        msg.immutables.coin = cw20::Balance::from(vec![Coin::new(1000u128, "xyz")]);
        // insufficient order funds
        err = app
            .instantiate_contract(
                code_id,
                maker.clone(),
                &msg,
                &[Coin::new(1000u128, "stake")],
                "test",
                None,
            )
            .unwrap_err();
        assert_eq!(err.root_cause().to_string(), "InsufficientFunds");

        msg.immutables.coin = cw20::Balance::from(vec![Coin::new(1000u128, "xyz")]);
        // sufficient funds
        result = app.instantiate_contract(
            code_id,
            maker.clone(),
            &msg,
            &[Coin::new(1000u128, "stake"), Coin::new(1000u128, "xyz")],
            "test",
            None,
        );
        assert_eq!(result.is_ok(), true);

        let contract = CwTemplateContract(result.unwrap());
        let state = contract.get_state::<App, String, QueryMsg>(&app).unwrap();

        assert_eq!(state.rescue_delay, 600u64);
        assert_eq!(
            state.immutables_hash,
            "bd63c10445e434e9ac50786a6f5ab835160d0a8f2cae9b7837b03c0cf49537c1"
        );
    }

    #[test]
    fn withdraw() {
        let (maker, taker, _public) = users();
        let (mut app, contract, secret, immutables) = setup_contract();

        let msg = &contract
            .call(ExecuteMsg::Withdraw {
                secret: secret,
                immutables: immutables.clone(),
            })
            .unwrap();

        let err = app.execute(maker.clone(), msg.clone()).unwrap_err();
        assert_eq!(err.root_cause().to_string(), "InvalidCaller");

        // withdrawal delay not passed yet
        let err = app.execute(taker.clone(), msg.clone()).unwrap_err();
        assert_eq!(err.root_cause().to_string(), "InvalidTime");

        // fasttrack to cancellation delay
        app.update_block(|block| {
            block.time = block.time.plus_seconds(120);
            block.height += 1;
        });
        // cannot withdraw after cancellation delay passed
        let err = app.execute(taker.clone(), msg.clone()).unwrap_err();
        assert_eq!(err.root_cause().to_string(), "InvalidTime");

        // move back to withdrawal delay
        app.update_block(|block| {
            block.time = block.time.minus_seconds(60);
            block.height += 1;
        });

        let maker_bal_before = balance(&app, &maker);
        let taker_bal_before = balance(&app, &taker);
        app.execute(taker.clone(), msg.clone()).unwrap();
        let maker_bal_after = balance(&app, &maker);
        let taker_bal_after = balance(&app, &taker);

        assert_eq!(maker_bal_after - maker_bal_before, Uint128::new(1000000));
        assert_eq!(
            taker_bal_after - taker_bal_before,
            immutables.safety_deposit
        );
    }

    fn balance(app: &App, addr: &Addr) -> Uint128 {
        let coin = app.wrap().query_balance(addr, "stake").unwrap();
        return coin.amount;
    }
}
