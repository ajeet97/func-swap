use cosmwasm_std::{Deps, StdResult};

use crate::{msg::GetStateResponse, state::STATE};

pub fn get_state(deps: Deps) -> StdResult<GetStateResponse> {
    let state = STATE.load(deps.storage)?;
    Ok(GetStateResponse {
        rescue_delay: state.rescue_delay,
        immutables_hash: state.immutables_hash,
    })
}
