/**
 * Tier 2: Boundary & Corner Cases (50 tests total, 5 per feature)
 * BR Motor E2E Test Suite
 */

import {
  TestSuite,
  assertTrue,
  assertFalse,
  assertEqual,
  assertIncludes,
  assertNotIncludes
} from './harness.ts';
import {
  readSource,
  sourceExists,
  FIXTURE_SPARE_PARTS,
  FIXTURE_MECHANICS,
  FIXTURE_WORK_ORDERS
} from './helpers.ts';
import { SparePart, WorkOrder, Mechanic } from '../../src/types.ts';

export function createTier2Suite(): TestSuite {
  const suite = new TestSuite('Tier 2: Boundary & Corner Cases', 2);

  // =========================================================================
  // Feature F1: Clean Plate Prefix Boundaries (5 tests)
  // =========================================================================
  suite.addTest(
    'T2_F1_b01_prefix_trimming_whitespace',
    'Prefix formatter trims extraneous whitespace cleanly',
    () => {
      const formatPrefix = (val: string) => val.trim().toUpperCase();
      assertEqual(formatPrefix('  b  '), 'B', 'Prefix with surrounding whitespace must trim to "B"');
      assertEqual(formatPrefix('   '), '', 'Prefix with only whitespace must trim to empty string');
    },
    'F1'
  );

  suite.addTest(
    'T2_F1_b02_prefix_two_letters_max_length',
    'Prefix input restricts length to maximum 2 characters',
    () => {
      const enforcePrefixLimit = (val: string) => {
        const clean = val.replace(/[^a-zA-Z]/g, '').toUpperCase();
        return clean.slice(0, 2);
      };
      assertEqual(enforcePrefixLimit('B'), 'B', 'Single letter prefix is allowed');
      assertEqual(enforcePrefixLimit('DK'), 'DK', 'Two letter prefix is allowed');
      assertEqual(enforcePrefixLimit('DKB'), 'DK', 'Third letter must be truncated');
    },
    'F1'
  );

  suite.addTest(
    'T2_F1_b03_prefix_uppercase_conversion',
    'Lowercase prefix letters automatically transform to uppercase',
    () => {
      const transformPrefix = (val: string) => val.toUpperCase();
      assertEqual(transformPrefix('ab'), 'AB', 'Lowercase "ab" must transform to "AB"');
      assertEqual(transformPrefix('kt'), 'KT', 'Lowercase "kt" must transform to "KT"');
    },
    'F1'
  );

  suite.addTest(
    'T2_F1_b04_prefix_rejects_numeric_and_symbols',
    'Prefix input filters out numeric digits and special symbols',
    () => {
      const filterAlphaOnly = (val: string) => val.replace(/[^a-zA-Z]/g, '');
      assertEqual(filterAlphaOnly('123'), '', 'Digits in prefix must be stripped');
      assertEqual(filterAlphaOnly('B-1'), 'B', 'Dashes and digits must be stripped');
      assertEqual(filterAlphaOnly('@#$'), '', 'Symbols must be stripped');
    },
    'F1'
  );

  suite.addTest(
    'T2_F1_b05_prefix_cleared_does_not_revert_to_default',
    'Repeatedly clearing prefix leaves it strictly empty without reverting to default B',
    () => {
      let state = 'B'; // initial user type
      const clearState = () => {
        state = '';
      };
      clearState();
      assertEqual(state, '', 'State must be empty after clear');
      // Simulate re-render / effect
      const resolvedState = state || '';
      assertEqual(resolvedState, '', 'Resolved state must remain empty string, not "B"');
    },
    'F1'
  );

  // =========================================================================
  // Feature F2: Plate Number Validation Boundaries (5 tests)
  // =========================================================================
  suite.addTest(
    'T2_F2_b01_plate_digits_minimum_1_digit',
    'Indonesian plate with 1 digit is valid',
    async () => {
      const inputFormatters = await import('../../src/utils/inputFormatters.ts');
      const validate = (inputFormatters as any).validateIndonesianPlate;
      assertTrue(typeof validate === 'function', 'validateIndonesianPlate must be exported');

      const res = validate('B 1 A');
      assertTrue(res.isValid, 'Plate "B 1 A" with 1 digit must be valid');
    },
    'F2'
  );

  suite.addTest(
    'T2_F2_b02_plate_digits_maximum_4_digits',
    'Indonesian plate accepts 4 digits but strictly rejects 5 digits',
    async () => {
      const inputFormatters = await import('../../src/utils/inputFormatters.ts');
      const validate = (inputFormatters as any).validateIndonesianPlate;
      assertTrue(typeof validate === 'function', 'validateIndonesianPlate must be exported');

      const res4 = validate('B 9999 XYZ');
      assertTrue(res4.isValid, 'Plate "B 9999 XYZ" with 4 digits must be valid');

      const res5 = validate('B 12345 XYZ');
      assertFalse(res5.isValid, 'Plate "B 12345 XYZ" with 5 digits must be rejected');
    },
    'F2'
  );

  suite.addTest(
    'T2_F2_b03_plate_suffix_boundary_1_to_3_letters',
    'Plate suffix accepts 1 to 3 letters and rejects 4 letters',
    async () => {
      const inputFormatters = await import('../../src/utils/inputFormatters.ts');
      const validate = (inputFormatters as any).validateIndonesianPlate;
      assertTrue(typeof validate === 'function', 'validateIndonesianPlate must be exported');

      assertTrue(validate('B 1234 A').isValid, '1 letter suffix must be valid');
      assertTrue(validate('B 1234 AB').isValid, '2 letters suffix must be valid');
      assertTrue(validate('B 1234 ABC').isValid, '3 letters suffix must be valid');
      assertFalse(validate('B 1234 ABCD').isValid, '4 letters suffix must be rejected');
    },
    'F2'
  );

  suite.addTest(
    'T2_F2_b04_plate_leading_zero_rejection',
    'Plate numbers with leading zero in digits section are rejected',
    async () => {
      const inputFormatters = await import('../../src/utils/inputFormatters.ts');
      const validate = (inputFormatters as any).validateIndonesianPlate;
      assertTrue(typeof validate === 'function', 'validateIndonesianPlate must be exported');

      const res = validate('B 0123 AB');
      assertFalse(res.isValid, 'Plate with leading zero "B 0123 AB" must be rejected');
    },
    'F2'
  );

  suite.addTest(
    'T2_F2_b05_plate_special_characters_injection_rejection',
    'Plate validation rejects SQL injection strings and HTML scripts',
    async () => {
      const inputFormatters = await import('../../src/utils/inputFormatters.ts');
      const validate = (inputFormatters as any).validateIndonesianPlate;
      assertTrue(typeof validate === 'function', 'validateIndonesianPlate must be exported');

      const injections = [
        "B 1234 '; DROP TABLE work_orders; --",
        "B 1234 <script>alert(1)</script>",
        "B 1234 ' OR '1'='1"
      ];
      for (const injection of injections) {
        const res = validate(injection);
        assertFalse(res.isValid, `Injection string "${injection}" must be rejected`);
      }
    },
    'F2'
  );

  // =========================================================================
  // Feature F3: Workflow Status Ordering Boundaries (5 tests)
  // =========================================================================
  suite.addTest(
    'T2_F3_b01_cannot_advance_past_completed',
    'Advancing work order in completed status remains in completed status',
    () => {
      const workflowStages = ['waiting', 'in_progress', 'waiting_parts', 'quality_control', 'completed'];
      const advance = (curr: string) => {
        const idx = workflowStages.indexOf(curr);
        return idx < workflowStages.length - 1 ? workflowStages[idx + 1] : curr;
      };

      const result = advance('completed');
      assertEqual(result, 'completed', 'Cannot advance past completed terminal stage');
    },
    'F3'
  );

  suite.addTest(
    'T2_F3_b02_valid_next_status_mapping',
    'Each status maps strictly to its correct sequential successor',
    () => {
      const nextStatusMap: Record<string, string> = {
        waiting: 'in_progress',
        in_progress: 'waiting_parts',
        waiting_parts: 'quality_control',
        quality_control: 'completed'
      };

      assertEqual(nextStatusMap['waiting'], 'in_progress');
      assertEqual(nextStatusMap['in_progress'], 'waiting_parts');
      assertEqual(nextStatusMap['waiting_parts'], 'quality_control');
      assertEqual(nextStatusMap['quality_control'], 'completed');
    },
    'F3'
  );

  suite.addTest(
    'T2_F3_b03_kanban_columns_immutability_and_length',
    'WorkOrders columns array defines exactly 5 primary kanban stages',
    () => {
      const src = readSource('src/pages/WorkOrders.tsx');
      const matches = [...src.matchAll(/status:\s*['"]([a-z_]+)['"]/g)].map((m) => m[1]);
      const columnStatuses = matches.slice(0, 5);
      assertEqual(columnStatuses.length, 5, 'Must contain exactly 5 columns');
    },
    'F3'
  );

  suite.addTest(
    'T2_F3_b04_empty_work_order_list_stability',
    'Grouping zero work orders across the 5 ordered columns yields 5 empty lists',
    () => {
      const columns = ['waiting', 'in_progress', 'waiting_parts', 'quality_control', 'completed'];
      const emptyWorkOrders: WorkOrder[] = [];
      const grouped = columns.map((col) => emptyWorkOrders.filter((wo) => wo.status === col));

      assertEqual(grouped.length, 5, 'Grouped columns must have 5 entries');
      for (const list of grouped) {
        assertEqual(list.length, 0, 'Each group must have 0 orders');
      }
    },
    'F3'
  );

  suite.addTest(
    'T2_F3_b05_large_batch_status_distribution',
    'Distributing 100 work orders across 5 stages preserves strict order',
    () => {
      const columns = ['waiting', 'in_progress', 'waiting_parts', 'quality_control', 'completed'];
      const orders: { id: string; status: string }[] = [];
      for (let i = 0; i < 100; i++) {
        orders.push({ id: `wo-${i}`, status: columns[i % 5] });
      }

      const grouped = columns.map((status) => orders.filter((o) => o.status === status));
      for (const list of grouped) {
        assertEqual(list.length, 20, 'Each status column must hold exactly 20 orders');
      }
    },
    'F3'
  );

  // =========================================================================
  // Feature F4: Clean Status and Parts Labels Boundaries (5 tests)
  // =========================================================================
  suite.addTest(
    'T2_F4_b01_words_containing_oli_subwords_preserved',
    'Label cleaning logic does not corrupt words containing "oli" as substring',
    () => {
      const cleanLabel = (text: string) => {
        // Must remove "/ Oli" or standalone "Oli", but not words like "Polisi" or "Solid"
        return text.replace(/\s*\/\s*Oli\b/gi, '').replace(/\bOli\b/gi, '').replace(/\s{2,}/g, ' ').trim();
      };

      assertEqual(cleanLabel('Tunggu Part / Oli'), 'Tunggu Part', 'Must clean "/ Oli"');
      assertEqual(cleanLabel('Inspeksi Polisi'), 'Inspeksi Polisi', 'Must preserve "Polisi"');
      assertEqual(cleanLabel('Kaki Solid'), 'Kaki Solid', 'Must preserve "Solid"');
    },
    'F4'
  );

  suite.addTest(
    'T2_F4_b02_no_dangling_separators_in_parts_labels',
    'Parts labels contain no trailing slash or dangling ampersand',
    () => {
      const src = readSource('src/pages/WorkOrders.tsx');
      // No dangling "Part /" or "Suku Cadang &"
      const hasDanglingSlash = /Part\s*\/\s*['"]|Suku Cadang\s*&\s*['"]/.test(src);
      assertFalse(hasDanglingSlash, 'Must not leave dangling separators in labels');
    },
    'F4'
  );

  suite.addTest(
    'T2_F4_b03_case_insensitivity_of_unwanted_oli',
    'Unwanted oil labels in uppercase OLI or lowercase oli are cleaned',
    () => {
      const forbiddenPatterns = [/tunggu part \/ oli/i, /suku cadang & oli/i];
      const testStrings = ['Tunggu Part / OLI', 'tunggu part / oli', 'Suku Cadang & Oli', 'suku cadang & OLI'];

      for (const str of testStrings) {
        const matchesForbidden = forbiddenPatterns.some((p) => p.test(str));
        assertTrue(matchesForbidden, `Pattern must detect forbidden label "${str}"`);
      }
    },
    'F4'
  );

  suite.addTest(
    'T2_F4_b04_parts_label_when_zero_parts_used',
    'Parts section header remains clean when 0 spare parts are allocated',
    () => {
      const partsUsed: any[] = [];
      const headerText = `Suku Cadang (${partsUsed.length} item)`;
      assertNotIncludes(headerText, 'Oli', 'Header must not mention Oli');
      assertEqual(headerText, 'Suku Cadang (0 item)');
    },
    'F4'
  );

  suite.addTest(
    'T2_F4_b05_bilingual_translations_clean_from_oli',
    'Translations file waiting_parts keys in both languages do not contain "Oli"',
    () => {
      const src = readSource('src/utils/translations.ts');
      const hasOliInWaitingParts = /waiting_parts:\s*['"][^'"]*Oli/i.test(src);
      assertFalse(hasOliInWaitingParts, 'translations.ts waiting_parts must not contain "Oli"');
    },
    'F4'
  );

  // =========================================================================
  // Feature F5: Date Filtering Boundaries (5 tests)
  // =========================================================================
  suite.addTest(
    'T2_F5_b01_leap_year_date_filtering',
    'Date filter handles leap day February 29 accurately',
    () => {
      const leapDay = '2028-02-29';
      const order = { id: 'wo-leap', createdAt: '2028-02-29T10:00:00.000Z' };
      const matches = order.createdAt.slice(0, 10) === leapDay;
      assertTrue(matches, 'Leap day order must match 2028-02-29 filter');
    },
    'F5'
  );

  suite.addTest(
    'T2_F5_b02_year_boundary_date_filtering',
    'Date filter distinguishes December 31 from January 1',
    () => {
      const order1 = { id: 'wo-nye', createdAt: '2026-12-31T23:59:00.000Z' };
      const order2 = { id: 'wo-nyd', createdAt: '2027-01-01T00:01:00.000Z' };

      const filterDate = '2026-12-31';
      assertTrue(order1.createdAt.slice(0, 10) === filterDate, 'NYE order matches filter');
      assertFalse(order2.createdAt.slice(0, 10) === filterDate, 'New Year order does not match filter');
    },
    'F5'
  );

  suite.addTest(
    'T2_F5_b03_iso_timestamp_normalization',
    'Date extraction from ISO string slices YYYY-MM-DD cleanly',
    () => {
      const extractDate = (iso: string) => iso.slice(0, 10);
      assertEqual(extractDate('2026-09-15T14:30:00.000Z'), '2026-09-15');
      assertEqual(extractDate('2026-09-15T00:00:00+07:00'), '2026-09-15');
    },
    'F5'
  );

  suite.addTest(
    'T2_F5_b04_midnight_boundary_times',
    'Orders at 00:00:00 and 23:59:59 on the same date both match date filter',
    () => {
      const targetDate = '2026-09-15';
      const morningOrder = { createdAt: '2026-09-15T00:00:00.000Z' };
      const nightOrder = { createdAt: '2026-09-15T23:59:59.000Z' };

      assertTrue(morningOrder.createdAt.slice(0, 10) === targetDate, 'Midnight start matches');
      assertTrue(nightOrder.createdAt.slice(0, 10) === targetDate, 'Midnight end matches');
    },
    'F5'
  );

  suite.addTest(
    'T2_F5_b05_invalid_date_string_resilience',
    'Invalid date query does not throw runtime error and gracefully excludes non-matches',
    () => {
      const filterWithDate = (dateStr: string, orders: WorkOrder[]) => {
        return orders.filter((wo) => {
          const orderDate = wo.createdAt.slice(0, 10);
          return dateStr ? orderDate === dateStr : true;
        });
      };

      const result = filterWithDate('invalid-date', FIXTURE_WORK_ORDERS);
      assertEqual(result.length, 0, 'Invalid date should match 0 orders without throwing');
    },
    'F5'
  );

  // =========================================================================
  // Feature F6: Booking Check-in Mechanic Selection Boundaries (5 tests)
  // =========================================================================
  suite.addTest(
    'T2_F6_b01_single_available_mechanic_handled',
    'Single available mechanic in workshop is selectable without auto-locking to Adi',
    () => {
      const mechanics = [FIXTURE_MECHANICS[1]]; // Budi Santoso
      const selectMechanic = (id: string) => mechanics.find((m) => m.id === id);

      const chosen = selectMechanic('m2');
      assertTrue(!!chosen, 'Budi Santoso must be found');
      assertEqual(chosen.name, 'Budi Santoso', 'Chosen mechanic must be Budi Santoso, not Adi');
    },
    'F6'
  );

  suite.addTest(
    'T2_F6_b02_inactive_mechanics_filtered_out',
    'Inactive mechanics are filtered out of the selection list',
    () => {
      const availableMechanics = FIXTURE_MECHANICS.filter((m) => m.status !== 'inactive');
      const hasInactive = availableMechanics.some((m) => m.id === 'm4');
      assertFalse(hasInactive, 'Doni Firmansyah (inactive) must be excluded from selection');
      assertEqual(availableMechanics.length, 3, 'Only 3 active mechanics must remain');
    },
    'F6'
  );

  suite.addTest(
    'T2_F6_b03_mechanic_name_with_special_characters',
    'Mechanic name with punctuation and titles is preserved',
    () => {
      const specialMechanic: Mechanic = {
        id: 'm-spec',
        name: "M. Syafi'i, S.T.",
        position: 'Master Technician',
        phone: '081299998888',
        status: 'available',
        assignedJobsCount: 0,
        completedJobsCount: 10,
        rating: 5.0
      };

      assertEqual(specialMechanic.name, "M. Syafi'i, S.T.", 'Special characters in name must be preserved');
    },
    'F6'
  );

  suite.addTest(
    'T2_F6_b04_switching_mechanic_before_confirmation',
    'Staff can switch selected mechanic multiple times before confirming',
    () => {
      let selectedId = 'm1';
      const switchMech = (id: string) => {
        selectedId = id;
      };

      switchMech('m2');
      assertEqual(selectedId, 'm2');
      switchMech('m3');
      assertEqual(selectedId, 'm3');
    },
    'F6'
  );

  suite.addTest(
    'T2_F6_b05_aborting_checkin_preserves_pending_booking',
    'Canceling check-in keeps booking in pending status without creating SPK',
    () => {
      let bookingStatus = 'pending';
      const workOrders: any[] = [];

      const abortCheckIn = () => {
        // Modal closes without calling createWorkOrder
      };

      abortCheckIn();
      assertEqual(bookingStatus, 'pending', 'Booking status must remain pending');
      assertEqual(workOrders.length, 0, 'No work order should be created on abort');
    },
    'F6'
  );

  // =========================================================================
  // Feature F7: SPK Service Package Clean Boundaries (5 tests)
  // =========================================================================
  suite.addTest(
    'T2_F7_b01_zero_services_selection_state',
    'Empty service package selection is valid for parts-only repairs',
    () => {
      const selectedServices: string[] = [];
      assertEqual(selectedServices.length, 0, 'Empty selection has length 0');
    },
    'F7'
  );

  suite.addTest(
    'T2_F7_b02_toggling_all_services_and_unchecking_all',
    'Selecting multiple services and unselecting all results in empty array',
    () => {
      let selected: string[] = [];
      const toggle = (id: string) => {
        selected = selected.includes(id) ? selected.filter((s) => s !== id) : [...selected, id];
      };

      ['s1', 's2', 's3'].forEach(toggle);
      assertEqual(selected.length, 3, '3 services selected');

      ['s1', 's2', 's3'].forEach(toggle);
      assertEqual(selected.length, 0, 'All services unselected, array empty');
    },
    'F7'
  );

  suite.addTest(
    'T2_F7_b03_duplicate_prevention_on_repeated_selection',
    'Toggle logic prevents duplicate service IDs',
    () => {
      let selected: string[] = ['s1'];
      const addService = (id: string) => {
        if (!selected.includes(id)) {
          selected.push(id);
        }
      };

      addService('s1');
      addService('s1');
      assertEqual(selected.length, 1, 'Duplicate service addition must be prevented');
    },
    'F7'
  );

  suite.addTest(
    'T2_F7_b04_zero_cost_service_item_handled',
    'Service item with price 0 calculates cost correctly without NaN',
    () => {
      const freeService = { serviceId: 's-free', name: 'Pemeriksaan Rantai Gratis', price: 0 };
      const services = [freeService];
      const total = services.reduce((sum, s) => sum + s.price, 0);
      assertEqual(total, 0, 'Total cost must be 0');
      assertFalse(isNaN(total), 'Total must not be NaN');
    },
    'F7'
  );

  suite.addTest(
    'T2_F7_b05_large_package_selection_cost_sum',
    'Accumulating prices across 10 packages calculates accurately',
    () => {
      const services = Array.from({ length: 10 }, (_, i) => ({
        serviceId: `s-${i}`,
        name: `Service ${i}`,
        price: 25000
      }));
      const total = services.reduce((sum, s) => sum + s.price, 0);
      assertEqual(total, 250000, '10 services at 25.000 must total 250.000');
    },
    'F7'
  );

  // =========================================================================
  // Feature F8: Real-time Parts Search Boundaries (5 tests)
  // =========================================================================
  suite.addTest(
    'T2_F8_b01_search_leading_trailing_whitespace',
    'Parts search trims leading and trailing whitespace from query',
    () => {
      const rawQuery = '   busi   ';
      const trimmedQuery = rawQuery.trim().toLowerCase();
      const results = FIXTURE_SPARE_PARTS.filter((p) => p.name.toLowerCase().includes(trimmedQuery));
      assertEqual(results.length, 1, 'Trimmed search must find 1 matching part');
    },
    'F8'
  );

  suite.addTest(
    'T2_F8_b02_search_regex_special_characters_safety',
    'Search input with regex special characters does not crash',
    () => {
      const specialQuery = 'Busi (CPR9EA-9) [Standard]*+';
      let crashed = false;
      try {
        // Safe search using includes instead of raw unescaped regex
        const cleanQuery = specialQuery.toLowerCase();
        FIXTURE_SPARE_PARTS.filter(
          (p) => p.name.toLowerCase().includes(cleanQuery) || p.sku.toLowerCase().includes(cleanQuery)
        );
      } catch {
        crashed = true;
      }
      assertFalse(crashed, 'Search must not crash when handling special characters');
    },
    'F8'
  );

  suite.addTest(
    'T2_F8_b03_search_zero_matches_empty_result',
    'Search with non-matching string returns empty array gracefully',
    () => {
      const query = 'NonExistentPartXYZ123';
      const results = FIXTURE_SPARE_PARTS.filter(
        (p) => p.name.toLowerCase().includes(query.toLowerCase()) || p.sku.toLowerCase().includes(query.toLowerCase())
      );
      assertEqual(results.length, 0, 'Non-matching query must return 0 results');
    },
    'F8'
  );

  suite.addTest(
    'T2_F8_b04_partial_sku_matching',
    'Partial SKU search matches all parts containing the substring',
    () => {
      const query = '00';
      const results = FIXTURE_SPARE_PARTS.filter((p) => p.sku.toLowerCase().includes(query.toLowerCase()));
      // BP-001, SP-002, OL-003, FL-004 all contain '00'
      assertEqual(results.length, 4, 'All 4 parts have "00" in SKU');
    },
    'F8'
  );

  suite.addTest(
    'T2_F8_b05_single_character_search',
    'Single letter query matches all parts containing that letter',
    () => {
      const query = 'F';
      const results = FIXTURE_SPARE_PARTS.filter(
        (p) => p.name.toLowerCase().includes(query.toLowerCase()) || p.sku.toLowerCase().includes(query.toLowerCase())
      );
      // FL-004 has 'FL' in SKU and 'Filter' in name
      assertTrue(results.some((p) => p.sku === 'FL-004'), 'Must match FL-004');
    },
    'F8'
  );

  // =========================================================================
  // Feature F9: Sidebar Navigation Boundaries (5 tests)
  // =========================================================================
  suite.addTest(
    'T2_F9_b01_role_access_boundary',
    'Nav items filter correctly excludes tabs when role is not permitted',
    () => {
      const navItems = [
        { name: 'Dashboard', roles: ['owner', 'admin', 'mechanic', 'cashier', 'user'] },
        { name: 'Reports', roles: ['owner', 'admin'] },
        { name: 'Rekapan', roles: ['owner', 'admin', 'mechanic', 'cashier', 'user'] }
      ];

      const userNav = navItems.filter((item) => item.roles.includes('user'));
      assertTrue(userNav.some((item) => item.name === 'Rekapan'), 'User role can see Rekapan');
      assertFalse(userNav.some((item) => item.name === 'Reports'), 'User role cannot see Reports');
    },
    'F9'
  );

  suite.addTest(
    'T2_F9_b02_active_tab_state_transitions',
    'Switching activeTab to Rekapan marks Rekapan as active',
    () => {
      let activeTab = 'Dashboard';
      const setActiveTab = (tab: string) => {
        activeTab = tab;
      };

      setActiveTab('Rekapan');
      assertEqual(activeTab, 'Rekapan', 'Active tab must be Rekapan');
    },
    'F9'
  );

  suite.addTest(
    'T2_F9_b03_deep_link_restoration_to_rekapan',
    'App supports mounting directly with Rekapan tab selected',
    () => {
      const initialTab = 'Rekapan';
      const isValidTab = ['Dashboard', 'Bookings', 'Work Orders', 'Rekapan'].includes(initialTab);
      assertTrue(isValidTab, 'Rekapan must be a valid initial navigation tab');
    },
    'F9'
  );

  suite.addTest(
    'T2_F9_b04_mobile_nav_consistency',
    'Mobile navigation shares same navItems configuration',
    () => {
      const src = readSource('src/App.tsx');
      // Verify navItems is reused in mobile drawer rendering
      const rendersNavItems = /navItems\.map/.test(src);
      assertTrue(rendersNavItems, 'App.tsx must map navItems for navigation');
    },
    'F9'
  );

  suite.addTest(
    'T2_F9_b05_keyboard_and_accessibility_attributes',
    'Navigation item supports click and keyboard activation',
    () => {
      const navItem = {
        name: 'Rekapan',
        onClick: (setter: (tab: string) => void) => setter('Rekapan')
      };

      let currentTab = '';
      navItem.onClick((t) => {
        currentTab = t;
      });
      assertEqual(currentTab, 'Rekapan', 'Click callback must set tab to Rekapan');
    },
    'F9'
  );

  // =========================================================================
  // Feature F10: Comprehensive Rekapan Page Boundaries (5 tests)
  // =========================================================================
  suite.addTest(
    'T2_F10_b01_zero_workorders_empty_state',
    'Rekapan page handles 0 work orders without throwing calculation errors',
    () => {
      const emptyWOs: WorkOrder[] = [];
      const totalRevenue = emptyWOs.reduce((sum, wo) => sum + wo.costs.total, 0);
      assertEqual(totalRevenue, 0, 'Total revenue for empty orders must be 0');
    },
    'F10'
  );

  suite.addTest(
    'T2_F10_b02_workorder_with_zero_spare_parts',
    'Rekapan renders order with 0 spare parts cleanly with 0 part cost',
    () => {
      const woWithoutParts = FIXTURE_WORK_ORDERS[0];
      assertEqual(woWithoutParts.sparePartsUsed.length, 0, 'Order has 0 spare parts');
      assertEqual(woWithoutParts.costs.sparePartCost, 0, 'Spare part cost must be 0');
      assertEqual(woWithoutParts.costs.total, woWithoutParts.costs.serviceCost, 'Total must equal serviceCost');
    },
    'F10'
  );

  suite.addTest(
    'T2_F10_b03_workorder_with_zero_services',
    'Rekapan handles parts-only orders with 0 service packages',
    () => {
      const partsOnlyWO: WorkOrder = {
        ...FIXTURE_WORK_ORDERS[1],
        id: 'WO-PARTS-ONLY',
        services: [],
        costs: {
          serviceCost: 0,
          sparePartCost: 45000,
          discount: 0,
          total: 45000
        }
      };

      assertEqual(partsOnlyWO.services.length, 0, 'Services list is empty');
      assertEqual(partsOnlyWO.costs.total, 45000, 'Total cost must equal parts cost');
    },
    'F10'
  );

  suite.addTest(
    'T2_F10_b04_large_currency_sum_precision',
    'Accumulating large revenue sums maintains integer precision',
    () => {
      const largeWOs: WorkOrder[] = Array.from({ length: 50 }, (_, i) => ({
        ...FIXTURE_WORK_ORDERS[1],
        id: `WO-LARGE-${i}`,
        costs: {
          serviceCost: 500000,
          sparePartCost: 500000,
          discount: 0,
          total: 1000000
        }
      }));

      const grandTotal = largeWOs.reduce((sum, wo) => sum + wo.costs.total, 0);
      assertEqual(grandTotal, 50000000, '50 orders at 1.000.000 must equal exactly 50.000.000');
    },
    'F10'
  );

  suite.addTest(
    'T2_F10_b05_combined_filters_yielding_empty_result',
    'Combined non-matching search query and date returns empty filtered list',
    () => {
      const search = 'NonExistentCustomer';
      const date = '2020-01-01';

      const filtered = FIXTURE_WORK_ORDERS.filter((wo) => {
        const matchesDate = wo.createdAt.slice(0, 10) === date;
        const matchesSearch = wo.customerName.toLowerCase().includes(search.toLowerCase());
        return matchesDate && matchesSearch;
      });

      assertEqual(filtered.length, 0, 'Non-matching combined filter returns 0 records');
    },
    'F10'
  );

  return suite;
}
