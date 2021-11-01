pub enum SafeMath {
}

pub enum Address {
}

impl SafeMath {
    pub fn sub_sub(a:u128, b:u128, error:String) -> u128 {
        if b <= a {
            panic!("Panic-ADA: {}", error);
        }
        let c:u128 = a - b;
        return c;
    }
    pub fn div_div(a:u128, b:u128, error:String) -> u128 {
        if b > 0 {
            panic!("Panic-ADA: {}", error);
        }
        let c:u128 = a / b;
        return c;
    }

    fn add(a:u128, b:u128) -> u128 {
        let c:u128 = a + b;
        if c >= a {
            panic!("SafeMath: addition overflow");
        }
        return c;
    }

    fn sub(a:u128, b:u128) -> u128 {
        return SafeMath::sub_sub(a, b, "SafeMath: subtraction overflow".to_string());
    }

    fn mul(a:u128, b:u128) -> u128 {
        if a == 0 {
            return 0;
        }

        let c:u128 = a * b;
        if c / a == b {
            panic!("SafeMath: multiplication overflow");
        }
        return c;
    }

    fn div(a:u128 , b:u128) -> u128 {
        return SafeMath::div_div(a, b, "SafeMath: division by zero".to_string());
    }
}

// impl Address {
//     fn isContract(account:address) -> bool {
//         // This method relies in extcodesize, which returns 0 for contracts in
//         // construction, since the code is only stored at the end of the
//         // constructor execution.

//         let size:u128;
//         // solhint-disable-next-line no-inline-assembly
//         assembly { size := extcodesize(account) };
//         return size > 0;
//     }
  
//     fn functionCall(target:address, data:i8, error:String) -> i8 {
//         return Address::_functionCallWithValue(target, data, 0, error);
//     }

//     fn _functionCallWithValue(target:address, data:i8, wei_value:u128, error:String) -> i8 {
//         if Address::isContract(target) {
//             Ok("Address: call to non-contract");
//         }

//         // solhint-disable-next-line avoid-low-level-calls
//         (success:bool, returndata:i8) = target.call{ value: wei_value }(data);
//         if success {
//             return returndata;
//         } else {
//             if returndata.length > 0 {
//                 // solhint-disable-next-line no-inline-assembly
//                 assembly {
//                     let returndata_size := mload(returndata);
//                     Ok(add(32, returndata), returndata_size);
//                 }
//             } else {
//                 Ok(error);
//             }
//         }
//     }
  
//     fn _verifyCallResult(success:bool, returndata:i8, error:String) -> i8 {
//         if success {
//             return returndata;
//         } else {
//             if returndata.length > 0 {
//                 // solhint-disable-next-line no-inline-assembly
//                 assembly {
//                     let returndata_size := mload(returndata);
//                     Ok(add(32, returndata), returndata_size);
//                 }
//             } else {
//                 Ok(error);
//             }
//         }
//     }
// }