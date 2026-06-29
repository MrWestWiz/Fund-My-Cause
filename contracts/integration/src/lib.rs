#[cfg(test)]
mod tests {
    use crowdfund::{Category, CrowdfundContract, CrowdfundContractClient};
    use registry::{RegistryContract, RegistryContractClient};
    use soroban_sdk::{
        testutils::{Address as _, Ledger},
        token, Address, Env, String,
    };

    /// Helper: mint `amount` tokens to `to` via the stellar-asset admin client.
    fn mint(token_admin: &token::StellarAssetClient, to: &Address, amount: i128) {
        token_admin.mint(to, &amount);
    }

    /// Helper: deploy and initialise a crowdfund campaign.
    fn deploy_campaign<'a>(
        env: &'a Env,
        creator: &Address,
        token_id: &Address,
        goal: i128,
        deadline: u64,
    ) -> CrowdfundContractClient<'a> {
        let contract_id = env.register_contract(None, CrowdfundContract);
        let client = CrowdfundContractClient::new(env, &contract_id);
        client
            .initialize(
                creator,
                token_id,
                &goal,
                &deadline,
                &100,
                &0i128,
                &String::from_str(env, "Test Campaign"),
                &String::from_str(env, "Integration test"),
                &None,
                &None,
                &None,
                &Category::Other,
                &None,
                &None,
            )
            .unwrap();
        client
    }

    // ── Test 1: Registry + crowdfund: register and list ──────────────────────

    #[test]
    fn test_registry_register_and_list() {
        let env = Env::default();
        env.mock_all_auths();

        // Deploy registry
        let registry_id = env.register_contract(None, RegistryContract);
        let registry = RegistryContractClient::new(&env, &registry_id);

        // Deploy a campaign
        let creator = Address::generate(&env);
        let token_admin_addr = Address::generate(&env);
        let token_id = env.register_stellar_asset_contract(token_admin_addr);
        let deadline = env.ledger().timestamp() + 10_000;
        let campaign = deploy_campaign(&env, &creator, &token_id, 1_000, deadline);

        // Register the campaign's contract address in the registry
        registry.register(&campaign.address);

        // list() should return the one registered address
        let listed = registry.list(&0, &10);
        assert_eq!(listed.len(), 1);
        assert_eq!(listed.get(0).unwrap(), campaign.address);
    }

    // ── Test 2: contribute → withdraw with event assertion ───────────────────

    #[test]
    fn test_contribute_withdraw_lifecycle_with_events() {
        let env = Env::default();
        env.mock_all_auths();

        let creator = Address::generate(&env);
        let contributor = Address::generate(&env);
        let token_admin_addr = Address::generate(&env);
        let token_id = env.register_stellar_asset_contract(token_admin_addr.clone());
        let token_admin = token::StellarAssetClient::new(&env, &token_id);

        let deadline = env.ledger().timestamp() + 10_000;
        let goal = 500i128;
        let campaign = deploy_campaign(&env, &creator, &token_id, goal, deadline);

        // Fund contributor and contribute
        mint(&token_admin, &contributor, 1_000);
        campaign
            .contribute(&contributor, &600, &token_id, &None)
            .unwrap();

        // Advance time past deadline
        env.ledger().with_mut(|l| l.timestamp = deadline + 1);

        // Withdraw
        campaign.withdraw().unwrap();

        // Assert events were emitted (contribute + withdraw each emit at least one event)
        let evts = env.events().all();
        assert!(!evts.is_empty());
    }

    // ── Test 3: contribute → refund lifecycle ────────────────────────────────

    #[test]
    fn test_contribute_refund_lifecycle() {
        let env = Env::default();
        env.mock_all_auths();

        let creator = Address::generate(&env);
        let contributor = Address::generate(&env);
        let token_admin_addr = Address::generate(&env);
        let token_id = env.register_stellar_asset_contract(token_admin_addr.clone());
        let token_admin = token::StellarAssetClient::new(&env, &token_id);
        let token = token::Client::new(&env, &token_id);

        let deadline = env.ledger().timestamp() + 10_000;
        let goal = 1_000i128;
        let campaign = deploy_campaign(&env, &creator, &token_id, goal, deadline);

        mint(&token_admin, &contributor, 500);
        campaign
            .contribute(&contributor, &200, &token_id, &None)
            .unwrap();

        let balance_before = token.balance(&contributor);

        // Advance past deadline without reaching the goal → refund eligible
        env.ledger().with_mut(|l| l.timestamp = deadline + 1);

        campaign.refund_single(&contributor).unwrap();

        let balance_after = token.balance(&contributor);
        // Contributor should have received their 200 back
        assert_eq!(balance_after, balance_before + 200);
    }

    // ── Test 4: Registry deduplication across multiple campaigns ─────────────

    #[test]
    fn test_registry_deduplication_multiple_campaigns() {
        let env = Env::default();
        env.mock_all_auths();

        let registry_id = env.register_contract(None, RegistryContract);
        let registry = RegistryContractClient::new(&env, &registry_id);

        let creator = Address::generate(&env);
        let token_admin_addr = Address::generate(&env);
        let token_id = env.register_stellar_asset_contract(token_admin_addr);
        let deadline = env.ledger().timestamp() + 10_000;

        let c1 = deploy_campaign(&env, &creator, &token_id, 1_000, deadline);
        let c2 = deploy_campaign(&env, &creator, &token_id, 2_000, deadline);
        let c3 = deploy_campaign(&env, &creator, &token_id, 3_000, deadline);

        // Register all three
        registry.register(&c1.address);
        registry.register(&c2.address);
        registry.register(&c3.address);

        // Registering c2 again must not create a duplicate
        registry.register(&c2.address);

        let all = registry.list(&0, &10);
        assert_eq!(all.len(), 3, "duplicate registration must be ignored");

        // Each unique address appears exactly once
        assert!(all.contains(&c1.address));
        assert!(all.contains(&c2.address));
        assert!(all.contains(&c3.address));
    }
}
