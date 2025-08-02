use std::vec;

use cosmwasm_std::{
    to_json_binary, Addr, BankMsg, Coin, CosmosMsg, DepsMut, Env, MessageInfo, Response, Uint128,
    WasmMsg,
};
use cw20::Cw20ExecuteMsg;
use sha2::Digest;

use crate::{
    constants::NATIVE_DENOM,
    error::ContractError,
    msg::{Immutables, TimelockStage},
    state::STATE,
};

pub fn withdraw(
    deps: DepsMut,
    env: Env,
    info: MessageInfo,
    secret: String,
    immutables: Immutables,
) -> Result<Response, ContractError> {
    only_taker(&info, &immutables)?;
    only_after(&env, immutables.timelocks.get(TimelockStage::SrcWithdrawal))?;
    only_before(
        &env,
        immutables.timelocks.get(TimelockStage::SrcCancellation),
    )?;

    withdraw_to(deps, &secret, &info.sender, &info.sender, &immutables)
}

fn withdraw_to(
    deps: DepsMut,
    secret: &String,
    sender: &Addr,
    target: &Addr,
    immutables: &Immutables,
) -> Result<Response, ContractError> {
    only_valid_immutables(deps, immutables)?;
    only_valid_secret(secret, &immutables.hashlock)?;

    let mut msgs: Vec<CosmosMsg> = vec![];

    transfer(target, &immutables.coin, &mut msgs);
    // transfer(
    //     target,
    //     &native_balance(immutables.amount, &immutables.token),
    //     &mut msgs,
    // );
    transfer(
        sender,
        &native_balance(immutables.safety_deposit, NATIVE_DENOM),
        &mut msgs,
    );

    Ok(Response::new()
        .add_attribute("method", "withdraw")
        .add_attribute("secret", secret)
        .add_messages(msgs))
}

fn transfer(target: &Addr, token: &cw20::Balance, msgs: &mut Vec<CosmosMsg>) {
    match token {
        cw20::Balance::Native(coins) => {
            msgs.push(CosmosMsg::Bank(BankMsg::Send {
                to_address: target.clone().into_string(),
                amount: coins.clone().into_vec(),
            }));
        }
        cw20::Balance::Cw20(coin) => {
            let cw20_transfer = Cw20ExecuteMsg::Transfer {
                recipient: target.clone().into_string(),
                amount: coin.amount,
            };

            msgs.push(CosmosMsg::Wasm(WasmMsg::Execute {
                contract_addr: coin.clone().address.into_string(),
                msg: to_json_binary(&cw20_transfer).unwrap(),
                funds: vec![],
            }));
        }
    }
}

fn native_balance(amount: Uint128, denom: &str) -> cw20::Balance {
    cw20::Balance::from(vec![Coin::new(amount, denom)])
}

fn only_taker(info: &MessageInfo, immutables: &Immutables) -> Result<(), ContractError> {
    if info.sender != immutables.taker {
        return Err(ContractError::InvalidCaller {});
    }
    Ok(())
}

fn only_after(env: &Env, start: u128) -> Result<(), ContractError> {
    if env.block.time.seconds() < start as u64 {
        return Err(ContractError::InvalidTime {});
    }
    Ok(())
}

fn only_before(env: &Env, stop: u128) -> Result<(), ContractError> {
    if env.block.time.seconds() >= stop as u64 {
        return Err(ContractError::InvalidTime {});
    }
    Ok(())
}

fn only_valid_immutables(deps: DepsMut, immutables: &Immutables) -> Result<(), ContractError> {
    let state = STATE.load(deps.storage)?;
    let hash = immutables.hash().unwrap();
    if state.immutables_hash != hash {
        return Err(ContractError::InvalidImmutables {});
    }
    Ok(())
}

fn only_valid_secret(secret: &String, hashlock: &String) -> Result<(), ContractError> {
    let secret_hash = format!("{:x}", sha2::Sha256::digest(secret));
    if secret_hash != *hashlock {
        return Err(ContractError::InvalidSecret {});
    }
    Ok(())
}
