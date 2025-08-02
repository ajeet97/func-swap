#[cfg(not(feature = "library"))]
use cosmwasm_std::entry_point;
use cosmwasm_std::{
    to_json_binary, Binary, Deps, DepsMut, Env, MessageInfo, Response, StdResult, Uint128,
};
use cw2::set_contract_version;

use crate::{
    constants::{CONTRACT_NAME, CONTRACT_VERSION, NATIVE_DENOM},
    error::ContractError,
    execute,
    msg::{ExecuteMsg, InstantiateMsg, QueryMsg},
    state::{State, STATE},
};

// TODO: handle cw20 tokens (use instantiate2 and allow beforehand and transferFrom here??)

#[cfg_attr(not(feature = "library"), entry_point)]
pub fn instantiate(
    deps: DepsMut,
    _env: Env,
    info: MessageInfo,
    msg: InstantiateMsg,
) -> Result<Response, ContractError> {
    set_contract_version(deps.storage, CONTRACT_NAME, CONTRACT_VERSION)?;

    // deps.api
    //     .debug(format!("* safety_deposit: {}", msg.immutables.safety_deposit).as_str());

    let mut native_funds = info
        .funds
        .iter()
        .find(|&coin| coin.denom == NATIVE_DENOM)
        .ok_or(ContractError::InsufficientFunds {})?
        .amount;

    // deps.api
    //     .debug(format!("* native_funds: {}", native_funds).as_str());

    if native_funds < msg.immutables.safety_deposit {
        return Err(ContractError::InsufficientFunds {});
    }

    native_funds -= msg.immutables.safety_deposit;

    match msg.immutables.coin.clone() {
        cw20::Balance::Native(balance) => {
            let coins = balance.into_vec();
            if coins.len() != 1 {
                return Err(ContractError::InvalidCoin {});
            }

            let swap_coin = &coins[0];
            let swap_coin_funds: Uint128;

            if swap_coin.denom == NATIVE_DENOM {
                swap_coin_funds = native_funds;
            } else {
                swap_coin_funds = info
                    .funds
                    .iter()
                    .find(|coin| coin.denom == swap_coin.denom)
                    .ok_or(ContractError::InsufficientFunds {})?
                    .amount;
            }

            // deps.api
            //     .debug(format!("* swap coins funds: {}", swap_coin_funds).as_str());

            if swap_coin_funds != swap_coin.amount {
                return Err(ContractError::InsufficientFunds {});
            }
        }
        cw20::Balance::Cw20(_coin) => {} // do nothing for now
    }

    let state = State {
        rescue_delay: msg.rescue_delay,
        immutables_hash: msg.immutables.hash().unwrap(),
    };
    STATE.save(deps.storage, &state)?;

    Ok(Response::new()
        .add_attribute("method", "instantiate")
        .add_attribute("order_hash", msg.immutables.order_hash))
}

#[cfg_attr(not(feature = "library"), entry_point)]
pub fn execute(
    deps: DepsMut,
    env: Env,
    info: MessageInfo,
    msg: ExecuteMsg,
) -> Result<Response, ContractError> {
    match msg {
        ExecuteMsg::Withdraw { secret, immutables } => {
            execute::withdraw(deps, env, info, secret, immutables)
        }
    }
}

#[cfg_attr(not(feature = "library"), entry_point)]
pub fn query(_deps: Deps, _env: Env, msg: QueryMsg) -> StdResult<Binary> {
    match msg {
        QueryMsg::GetImmutablesHash {} => to_json_binary(""),
    }
}
