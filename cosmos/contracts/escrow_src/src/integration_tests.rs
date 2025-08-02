#[cfg(test)]
mod tests {
    use crate::helpers::CwTemplateContract;
    use crate::msg::{Immutables, InstantiateMsg, Timelocks};
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

    const USER: &str = "USER";
    const ADMIN: &str = "ADMIN";
    const NATIVE_DENOM: &str = "stake";

    fn mock_app() -> App {
        AppBuilder::new().build(|router, _, storage| {
            router
                .bank
                .init_balance(
                    storage,
                    &MockApi::default().addr_make(USER),
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

    #[test]
    fn init() {
        let (mut app, code_id) = setup();

        let secret: String = "abcd".into();
        let mut msg = InstantiateMsg {
            rescue_delay: 100,
            immutables: Immutables {
                order_hash: "order_1".into(),
                hashlock: format!("{:x}", Sha256::digest(secret)),
                maker: Addr::unchecked(USER),
                taker: Addr::unchecked(ADMIN),
                coin: cw20::Balance::from(vec![Coin::new(1000000u128, "stake")]),
                safety_deposit: Uint128::new(1000),
                timelocks: Timelocks {
                    dst: Uint128::new(138972037433247551493660541946142130176),
                    src: Uint128::new(0),
                },
            },
        };

        // valid msg
        let mut result = app.instantiate_contract(
            code_id,
            MockApi::default().addr_make(USER),
            &msg,
            &[Coin::new(1001000u128, "stake")],
            "test",
            None,
        );
        assert_eq!(result.is_ok(), true);

        // insufficient safety deposit
        let mut err = app
            .instantiate_contract(
                code_id,
                MockApi::default().addr_make(USER),
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
                MockApi::default().addr_make(USER),
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
                MockApi::default().addr_make(USER),
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
                MockApi::default().addr_make(USER),
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
            MockApi::default().addr_make(USER),
            &msg,
            &[Coin::new(1000u128, "stake"), Coin::new(1000u128, "xyz")],
            "test",
            None,
        );
        assert_eq!(result.is_ok(), true);
    }

    // mod count {
    //     use super::*;
    //     use crate::msg::ExecuteMsg;

    //     #[test]
    //     fn count() {
    //         let (mut app, cw_template_contract) = proper_instantiate();

    //         let msg = ExecuteMsg::Increment {};
    //         let cosmos_msg = cw_template_contract.call(msg).unwrap();
    //         app.execute(Addr::unchecked(USER), cosmos_msg).unwrap();
    //     }
    // }
}
