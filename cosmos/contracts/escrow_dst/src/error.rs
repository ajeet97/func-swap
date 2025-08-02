use cosmwasm_std::StdError;
use thiserror::Error;

#[derive(Error, Debug)]
pub enum ContractError {
    #[error("{0}")]
    Std(#[from] StdError),

    #[error("InvalidCaller")]
    InvalidCaller {},

    #[error("InvalidTime")]
    InvalidTime {},

    #[error("InvalidCoin")]
    InvalidCoin {},

    #[error("InsufficientFunds")]
    InsufficientFunds {},

    #[error("InvalidImmutables")]
    InvalidImmutables {},

    #[error("InvalidSecret")]
    InvalidSecret {},
    // Add any other custom errors you like here.
    // Look at https://docs.rs/thiserror/1.0.21/thiserror/ for details.
}
