use cosmwasm_schema::{cw_serde, QueryResponses};
use cosmwasm_std::{Addr, Uint128};
use sha2::{Digest, Sha256};

#[cw_serde]
pub struct InstantiateMsg {
    pub rescue_delay: u64,
    pub immutables: Immutables,
}

#[cw_serde]
pub enum ExecuteMsg {
    Withdraw {
        secret: String,
        immutables: Immutables,
    },
}

#[cw_serde]
#[derive(QueryResponses)]
pub enum QueryMsg {
    // GetImmutablesHash returns the current count as a json-encoded number
    #[returns(GetImmutablesHashResponse)]
    GetImmutablesHash {},
}

// We define a custom struct for each query response
#[cw_serde]
pub struct GetImmutablesHashResponse {
    pub hash: String,
}

/////////////////////////////////////

#[cw_serde]
pub struct Immutables {
    pub order_hash: String,
    pub hashlock: String,
    pub maker: Addr,
    pub taker: Addr,
    // pub token: String,
    // pub amount: u128,
    pub coin: cw20::Balance,
    pub safety_deposit: Uint128,
    pub timelocks: Timelocks,
}

impl Immutables {
    pub fn hash(&self) -> Option<String> {
        let json_bytes = serde_json::to_vec(self).ok()?;
        let hash_bytes = Sha256::digest(json_bytes);
        return Some(format!("{:x}", hash_bytes));
    }
}

#[cw_serde]
pub struct Timelocks {
    // <dst><src>
    pub dst: Uint128,
    pub src: Uint128,
}

// dst: DeployedAt / DstCancellation / DstPublicWithdrawal / DstWithdrawal
// src: SrcPublicCancellation / SrcCancellation / SrcPublicWithdrawal / SrcWithdrawal
pub enum TimelockStage {
    SrcWithdrawal,
    SrcPublicWithdrawal,
    SrcCancellation,
    SrcPublicCancellation,
    DstWithdrawal,
    DstPublicWithdrawal,
    DstCancellation,
}

impl Timelocks {
    pub fn get(&self, stage: TimelockStage) -> u128 {
        let mut shift: u128 = (stage as u128) * 32;
        let mut data: u128 = self.src.u128();

        if shift > 96 {
            data = self.dst.u128();
            shift -= 128;
        }

        let deployed_at: u32 = (self.dst.u128() >> 96) as u32;
        let stage_delay: u32 = (data >> shift) as u32;

        return deployed_at as u128 + stage_delay as u128;
    }

    pub fn deployed_at(&self) -> u128 {
        return self.dst.u128() >> 96;
    }
}

#[cfg(test)]
mod tests {
    use cosmwasm_std::Coin;

    use super::*;

    #[test]
    fn immutable_hash_test() {
        let amount: u128 = 1234;
        let coins = vec![Coin::new(amount, "uatom")];
        let immutables: Immutables = Immutables {
            order_hash: "abcd".to_string(),
            hashlock: "hashlock123".to_string(),
            maker: Addr::unchecked("maker"),
            taker: Addr::unchecked("taker"),
            coin: cw20::Balance::from(coins),
            safety_deposit: Uint128::new(100),
            timelocks: Timelocks {
                dst: Uint128::new(0xefefefefcdcdcdcdabababab90909090),
                src: Uint128::new(0x78787878565656563434343412121212),
            },
        };

        assert_eq!(
            "7c060b344580a3ad839b433cb15332053e1f92aa56440a4a4d30c8cc8aa4a660",
            immutables.hash().unwrap()
        );
    }

    #[test]
    fn timelocks_test() {
        let t: Timelocks = Timelocks {
            dst: Uint128::new(0xefefefefcdcdcdcdabababab90909090),
            src: Uint128::new(0x78787878565656563434343412121212),
        };

        let d: u128 = t.deployed_at();
        assert_eq!(d, 0xefefefef);
        assert_eq!(d + 0x12121212, t.get(TimelockStage::SrcWithdrawal));
        assert_eq!(d + 0x34343434, t.get(TimelockStage::SrcPublicWithdrawal));
        assert_eq!(d + 0x56565656, t.get(TimelockStage::SrcCancellation));
        assert_eq!(d + 0x78787878, t.get(TimelockStage::SrcPublicCancellation));
        assert_eq!(d + 0x90909090, t.get(TimelockStage::DstWithdrawal));
        assert_eq!(d + 0xabababab, t.get(TimelockStage::DstPublicWithdrawal));
        assert_eq!(d + 0xcdcdcdcd, t.get(TimelockStage::DstCancellation));
    }
}
