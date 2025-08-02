use schemars::JsonSchema;
use serde::{Deserialize, Serialize};

use cw_storage_plus::Item;

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, Eq, JsonSchema)]
pub struct State {
    pub rescue_delay: u64,
    pub immutables_hash: String,
}

pub const STATE: Item<State> = Item::new("state");
