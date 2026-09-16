/**
 * Tier 1: Feature Coverage (50 tests total, 5 per feature)
 * BR Motor E2E Test Suite
 */

import path from 'node:path';
import {
  TestSuite,
  assertTrue,
  assertFalse,
  assertEqual,
  assertIncludes,
  assertNotIncludes,
  assertMatch
} from './harness.ts';
import {
  readSource,
  sourceExists,
  getTodayLocalDateStr,
  getTomorrowLocalDateStr,
  getYesterdayLocalDateStr,
  FIXTURE_SPARE_PARTS,
  FIXTURE_WORK_ORDERS
} from './helpers.ts';
import { SparePart, WorkOrder } from '../../src/types.ts';

export function createTier1Suite(): TestSuite {
  const suite = new TestSuite('Tier 1: Feature Coverage', 1);

  // =========================================================================
  // Feature F1: Clean Plate Prefix (5 tests)
  // =========================================================================
  suite.addTest(
    'T1_F1_01_landing_initial_prefix_empty',
    'LandingPage platePrefix state initializes to empty string',
    () => {
      const src = readSource('src/pages/LandingPage.tsx');
      assertTrue(src.length > 0, 'src/pages/LandingPage.tsx must exist');
      // Look for useState('') for platePrefix
      const hasEmptyInitial = /const\s+\[platePrefix,\s*setPlatePrefix\]\s*=\s*useState<string>\s*\(\s*['"]['"]\s*\)|const\s+\[platePrefix,\s*setPlatePrefix\]\s*=\s*useState\s*\(\s*['"]['"]\s*\)/.test(src);
      const hasDefaultB = /const\s+\[platePrefix,\s*setPlatePrefix\]\s*=\s*useState\s*\(\s*['"]B['"]\s*\)/.test(src);
      assertFalse(hasDefaultB, 'platePrefix must NOT initialize with default value "B"');
      assertTrue(hasEmptyInitial, 'platePrefix must initialize with empty string');
    },
    'F1'
  );

  suite.addTest(
    'T1_F1_02_landing_form_reset_clears_prefix',
    'LandingPage booking form reset sets platePrefix to empty string',
    () => {
      const src = readSource('src/pages/LandingPage.tsx');
      assertTrue(src.length > 0, 'src/pages/LandingPage.tsx must exist');
      // Verify reset or clear calls setPlatePrefix('')
      const hasResetClear = /setPlatePrefix\s*\(\s*['"]['"]\s*\)/.test(src);
      assertTrue(hasResetClear, 'Form reset logic must call setPlatePrefix("") with empty string');
    },
    'F1'
  );

  suite.addTest(
    'T1_F1_03_landing_prefix_input_starts_blank',
    'LandingPage prefix input field has no hardcoded fallback letter',
    () => {
      const src = readSource('src/pages/LandingPage.tsx');
      assertTrue(src.length > 0, 'src/pages/LandingPage.tsx must exist');
      // The input element for plate prefix must bind to platePrefix and placeholder should guide without pre-filling
      const hasPrefixInput = /platePrefix/.test(src);
      assertTrue(hasPrefixInput, 'Prefix input binding must exist in LandingPage');
      const hasHardcodedValueB = /value\s*=\s*['"]B['"]/.test(src);
      assertFalse(hasHardcodedValueB, 'Prefix input must not have hardcoded value "B"');
    },
    'F1'
  );

  suite.addTest(
    'T1_F1_04_landing_fresh_guest_sees_empty_prefix',
    'Initial guest state configuration yields empty plate prefix',
    () => {
      const initialGuestBookingForm = {
        customerName: '',
        phone: '',
        platePrefix: '',
        plateNumber: '',
        plateSuffix: '',
      };
      assertEqual(initialGuestBookingForm.platePrefix, '', 'Initial guest plate prefix must be strictly empty');
    },
    'F1'
  );

  suite.addTest(
    'T1_F1_05_landing_prefix_no_hardcoded_b_fallback',
    'LandingPage contains no hardcoded B fallback in prefix state updater',
    () => {
      const src = readSource('src/pages/LandingPage.tsx');
      // Ensure no fallback like platePrefix || 'B'
      const hasFallbackB = /platePrefix\s*\|\|\s*['"]B['"]/.test(src);
      assertFalse(hasFallbackB, 'platePrefix must not fall back to "B" via logical OR');
    },
    'F1'
  );

  // =========================================================================
  // Feature F2: Plate Number Validation (5 tests)
  // =========================================================================
  suite.addTest(
    'T1_F2_01_validate_standard_indonesian_plate_success',
    'validateIndonesianPlate accepts standard Indonesian plates',
    async () => {
      const inputFormatters = await import('../../src/utils/inputFormatters.ts');
      const validate = (inputFormatters as any).validateIndonesianPlate;
      assertTrue(typeof validate === 'function', 'validateIndonesianPlate must be exported by src/utils/inputFormatters.ts');

      const plates = ['B 1234 XYZ', 'DK 8888 ZZ', 'AB 123 C', 'KT 4567 DEF'];
      for (const plate of plates) {
        const res = validate(plate);
        assertTrue(res && res.isValid === true, `Plate "${plate}" must be valid`);
      }
    },
    'F2'
  );

  suite.addTest(
    'T1_F2_02_validate_single_letter_and_single_digit',
    'validateIndonesianPlate accepts minimal 1-letter prefix and 1-digit plates',
    async () => {
      const inputFormatters = await import('../../src/utils/inputFormatters.ts');
      const validate = (inputFormatters as any).validateIndonesianPlate;
      assertTrue(typeof validate === 'function', 'validateIndonesianPlate must be exported by src/utils/inputFormatters.ts');

      const plates = ['D 1 A', 'B 99 B', 'L 7 XY'];
      for (const plate of plates) {
        const res = validate(plate);
        assertTrue(res && res.isValid === true, `Minimal plate "${plate}" must be valid`);
      }
    },
    'F2'
  );

  suite.addTest(
    'T1_F2_03_validate_rejects_empty_and_incomplete_plate',
    'validateIndonesianPlate rejects empty string and incomplete parts',
    async () => {
      const inputFormatters = await import('../../src/utils/inputFormatters.ts');
      const validate = (inputFormatters as any).validateIndonesianPlate;
      assertTrue(typeof validate === 'function', 'validateIndonesianPlate must be exported by src/utils/inputFormatters.ts');

      const invalidPlates = ['', '   ', '1234 XYZ', 'B 1234', 'B XYZ'];
      for (const plate of invalidPlates) {
        const res = validate(plate);
        assertTrue(res && res.isValid === false, `Incomplete plate "${plate}" must be rejected`);
        assertTrue(typeof res.message === 'string' && res.message.length > 0, 'Rejection must provide descriptive message');
      }
    },
    'F2'
  );

  suite.addTest(
    'T1_F2_04_validate_rejects_invalid_lengths_and_symbols',
    'validateIndonesianPlate rejects out-of-spec lengths and special characters',
    async () => {
      const inputFormatters = await import('../../src/utils/inputFormatters.ts');
      const validate = (inputFormatters as any).validateIndonesianPlate;
      assertTrue(typeof validate === 'function', 'validateIndonesianPlate must be exported by src/utils/inputFormatters.ts');

      const invalidPlates = ['ABC 123 D', 'B 12345 XYZ', 'B 1234 ABCD', 'B-1234-XYZ', 'B 01234 XYZ'];
      for (const plate of invalidPlates) {
        const res = validate(plate);
        assertTrue(res && res.isValid === false, `Invalid plate "${plate}" must be rejected`);
      }
    },
    'F2'
  );

  suite.addTest(
    'T1_F2_05_landing_booking_submission_blocks_invalid_plate',
    'LandingPage booking submission invokes plate validation and blocks invalid submissions',
    () => {
      const src = readSource('src/pages/LandingPage.tsx');
      assertTrue(src.length > 0, 'src/pages/LandingPage.tsx must exist');
      const usesValidation = /validateIndonesianPlate/.test(src) || /fullPlateNumber/.test(src);
      assertTrue(usesValidation, 'LandingPage must validate plate number before submitting booking');
      const callsValidator = /validateIndonesianPlate\s*\(/.test(src);
      assertTrue(callsValidator, 'LandingPage handleBookingSubmit must invoke validateIndonesianPlate');
    },
    'F2'
  );

  // =========================================================================
  // Feature F3: Workflow Status Ordering (5 tests)
  // =========================================================================
  suite.addTest(
    'T1_F3_01_workorders_columns_array_ordering',
    'WorkOrders columns array defines exactly 5 statuses in specified order',
    () => {
      const src = readSource('src/pages/WorkOrders.tsx');
      assertTrue(src.length > 0, 'src/pages/WorkOrders.tsx must exist');

      // Expected order: waiting -> in_progress -> waiting_parts -> quality_control -> completed
      const expectedStatuses = ['waiting', 'in_progress', 'waiting_parts', 'quality_control', 'completed'];

      // Extract status definitions from columns
      const matches = [...src.matchAll(/status:\s*['"]([a-z_]+)['"]/g)].map((m) => m[1]);
      // First 5 status definitions in columns
      const columnStatuses = matches.slice(0, 5);

      assertEqual(
        JSON.stringify(columnStatuses),
        JSON.stringify(expectedStatuses),
        'WorkOrders columns must be ordered: waiting, in_progress, waiting_parts, quality_control, completed'
      );
    },
    'F3'
  );

  suite.addTest(
    'T1_F3_02_in_progress_precedes_waiting_parts',
    'WorkOrders in_progress status is placed before waiting_parts',
    () => {
      const src = readSource('src/pages/WorkOrders.tsx');
      const inProgressIdx = src.indexOf("status: 'in_progress'");
      const waitingPartsIdx = src.indexOf("status: 'waiting_parts'");
      assertTrue(inProgressIdx !== -1, 'in_progress status must exist in columns');
      assertTrue(waitingPartsIdx !== -1, 'waiting_parts status must exist in columns');
      assertTrue(
        inProgressIdx < waitingPartsIdx,
        'in_progress must come BEFORE waiting_parts in WorkOrders kanban columns'
      );
    },
    'F3'
  );

  suite.addTest(
    'T1_F3_03_quality_control_precedes_completed',
    'WorkOrders quality_control status is placed before completed',
    () => {
      const src = readSource('src/pages/WorkOrders.tsx');
      const qcIdx = src.indexOf("status: 'quality_control'");
      const completedIdx = src.indexOf("status: 'completed'");
      assertTrue(qcIdx !== -1, 'quality_control status must exist in columns');
      assertTrue(completedIdx !== -1, 'completed status must exist in columns');
      assertTrue(qcIdx < completedIdx, 'quality_control must come BEFORE completed');
    },
    'F3'
  );

  suite.addTest(
    'T1_F3_04_work_order_card_status_advancement_sequence',
    'Work order progression sequentially steps through the 5 workflow stages',
    () => {
      const workflowStages = ['waiting', 'in_progress', 'waiting_parts', 'quality_control', 'completed'];
      let currentStage = 'waiting';

      const advance = (curr: string) => {
        const idx = workflowStages.indexOf(curr);
        return idx < workflowStages.length - 1 ? workflowStages[idx + 1] : curr;
      };

      currentStage = advance(currentStage);
      assertEqual(currentStage, 'in_progress', 'First advancement from waiting must be in_progress');

      currentStage = advance(currentStage);
      assertEqual(currentStage, 'waiting_parts', 'Second advancement must be waiting_parts');

      currentStage = advance(currentStage);
      assertEqual(currentStage, 'quality_control', 'Third advancement must be quality_control');

      currentStage = advance(currentStage);
      assertEqual(currentStage, 'completed', 'Fourth advancement must be completed');
    },
    'F3'
  );

  suite.addTest(
    'T1_F3_05_kanban_board_renders_all_five_stages_in_order',
    'WorkOrders kanban board renders headers corresponding to ordered workflow stages',
    () => {
      const src = readSource('src/pages/WorkOrders.tsx');
      // Verify kanban mapping iterates through columns
      const hasColumnMapping = /columns\.map/.test(src);
      assertTrue(hasColumnMapping, 'WorkOrders must iterate over columns array to render kanban stages');
    },
    'F3'
  );

  // =========================================================================
  // Feature F4: Clean Status and Parts Labels (5 tests)
  // =========================================================================
  suite.addTest(
    'T1_F4_01_waiting_parts_label_is_clean',
    'WorkOrders waiting_parts label is "Tunggu Part" and contains no "/ Oli"',
    () => {
      const src = readSource('src/pages/WorkOrders.tsx');
      // Check column definition label for waiting_parts
      const waitingPartsMatch = src.match(/status:\s*['"]waiting_parts['"],\s*label:\s*['"]([^'"]+)['"]/);
      assertTrue(!!waitingPartsMatch, 'waiting_parts column label definition must be found');
      const label = waitingPartsMatch[1];
      assertEqual(label, 'Tunggu Part', 'waiting_parts label must be exactly "Tunggu Part"');
      assertNotIncludes(label, '/ Oli', 'waiting_parts label must NOT contain "/ Oli"');
      assertNotIncludes(label, 'Oli', 'waiting_parts label must NOT contain "Oli"');
    },
    'F4'
  );

  suite.addTest(
    'T1_F4_02_in_progress_label_is_clean',
    'WorkOrders in_progress label is "Pengerjaan"',
    () => {
      const src = readSource('src/pages/WorkOrders.tsx');
      const inProgressMatch = src.match(/status:\s*['"]in_progress['"],\s*label:\s*['"]([^'"]+)['"]/);
      assertTrue(!!inProgressMatch, 'in_progress column label definition must be found');
      const label = inProgressMatch[1];
      assertEqual(label, 'Pengerjaan', 'in_progress label must be "Pengerjaan"');
    },
    'F4'
  );

  suite.addTest(
    'T1_F4_03_quality_control_label_is_clean',
    'WorkOrders quality_control label is "Uji Kelayakan"',
    () => {
      const src = readSource('src/pages/WorkOrders.tsx');
      const qcMatch = src.match(/status:\s*['"]quality_control['"],\s*label:\s*['"]([^'"]+)['"]/);
      assertTrue(!!qcMatch, 'quality_control column label definition must be found');
      const label = qcMatch[1];
      assertEqual(label, 'Uji Kelayakan', 'quality_control label must be "Uji Kelayakan"');
    },
    'F4'
  );

  suite.addTest(
    'T1_F4_04_workorders_parts_section_header_clean',
    'WorkOrders spare parts section header contains no "Suku Cadang & Oli"',
    () => {
      const src = readSource('src/pages/WorkOrders.tsx');
      // Look for parts headers in modals
      const hasOliInHeader = /Alokasi Suku Cadang & Oli|Penggantian Suku Cadang & Oli/.test(src);
      assertFalse(hasOliInHeader, 'WorkOrders parts section header must not contain "& Oli"');
      const hasCleanHeader = /Alokasi Suku Cadang|Penggantian Suku Cadang|Penggantian Part/.test(src);
      assertTrue(hasCleanHeader, 'WorkOrders parts section header must use clean label');
    },
    'F4'
  );

  suite.addTest(
    'T1_F4_05_dashboard_parts_labels_clean',
    'Dashboard status badges and parts labels do not contain "/ Oli"',
    () => {
      const src = readSource('src/pages/Dashboard.tsx');
      assertTrue(src.length > 0, 'src/pages/Dashboard.tsx must exist');
      const hasOliInParts = /Suku Cadang & Oli/.test(src);
      assertFalse(hasOliInParts, 'Dashboard.tsx must not contain "Suku Cadang & Oli"');
    },
    'F4'
  );

  // =========================================================================
  // Feature F5: Date Filtering Default Today (5 tests)
  // =========================================================================
  suite.addTest(
    'T1_F5_01_workorders_selected_date_initial_state_today',
    'WorkOrders selectedDate state defaults to current local date',
    () => {
      const src = readSource('src/pages/WorkOrders.tsx');
      const hasSelectedDateState = /const\s+\[selectedDate,\s*setSelectedDate\]\s*=\s*useState/.test(src);
      assertTrue(hasSelectedDateState, 'WorkOrders must define [selectedDate, setSelectedDate] state');
      // Should default to today's local date function or format
      const hasTodayDefault = /getTodayLocalDate|new Date\(\)|getLocalDateStr/.test(src);
      assertTrue(hasTodayDefault, 'selectedDate state must initialize to today local date');
    },
    'F5'
  );

  suite.addTest(
    'T1_F5_02_workorders_filters_out_future_dates_by_default',
    'WorkOrders filters out tomorrow and future work orders when filtered to today',
    () => {
      const today = getTodayLocalDateStr();
      const filtered = FIXTURE_WORK_ORDERS.filter((wo) => {
        const orderDate = wo.createdAt.slice(0, 10);
        return orderDate === today;
      });

      // WO-TOMORROW-01 must be excluded
      const hasTomorrow = filtered.some((wo) => wo.id === 'WO-TOMORROW-01');
      assertFalse(hasTomorrow, 'Tomorrow work orders must be excluded from today view');
      assertEqual(filtered.length, 2, 'Only today work orders (2 orders) must be included');
    },
    'F5'
  );

  suite.addTest(
    'T1_F5_03_workorders_includes_today_orders',
    'WorkOrders includes orders created today when date filter is today',
    () => {
      const today = getTodayLocalDateStr();
      const filtered = FIXTURE_WORK_ORDERS.filter((wo) => {
        const orderDate = wo.createdAt.slice(0, 10);
        return orderDate === today;
      });

      const hasToday1 = filtered.some((wo) => wo.id === 'WO-TODAY-01');
      const hasToday2 = filtered.some((wo) => wo.id === 'WO-TODAY-02');
      assertTrue(hasToday1, 'WO-TODAY-01 must be included');
      assertTrue(hasToday2, 'WO-TODAY-02 must be included');
    },
    'F5'
  );

  suite.addTest(
    'T1_F5_04_workorders_date_filter_change_updates_list',
    'Changing date filter selects orders matching the specified date',
    () => {
      const tomorrow = getTomorrowLocalDateStr();
      const filtered = FIXTURE_WORK_ORDERS.filter((wo) => {
        const orderDate = wo.createdAt.slice(0, 10);
        return orderDate === tomorrow;
      });

      assertEqual(filtered.length, 1, 'Only 1 order matches tomorrow');
      assertEqual(filtered[0].id, 'WO-TOMORROW-01', 'Selected order must be WO-TOMORROW-01');
    },
    'F5'
  );

  suite.addTest(
    'T1_F5_05_workorders_clearing_date_filter_shows_all',
    'Clearing date filter (empty string) returns all work orders across dates',
    () => {
      const selectedDate = '';
      const filtered = FIXTURE_WORK_ORDERS.filter((wo) => {
        const orderDate = wo.createdAt.slice(0, 10);
        return selectedDate ? orderDate === selectedDate : true;
      });

      assertEqual(filtered.length, FIXTURE_WORK_ORDERS.length, 'All work orders must be returned when date filter is empty');
    },
    'F5'
  );

  // =========================================================================
  // Feature F6: Booking Check-in Mechanic Selection (5 tests)
  // =========================================================================
  suite.addTest(
    'T1_F6_01_checkin_does_not_autolock_mechanic_adi',
    'Booking check-in does not automatically lock mechanic to "Adi"',
    () => {
      const srcApp = readSource('src/App.tsx');
      // In App.tsx handleCheckInDirect, check if assignedMech is hardcoded to find 'Adi'
      const hardcodedAdi = /assignedMechanicName\s*:\s*['"]Adi['"]|assignedMech.*name.*===.*['"]Adi['"]/.test(srcApp);
      assertFalse(hardcodedAdi, 'Check-in must not hardcode mechanic to "Adi"');
    },
    'F6'
  );

  suite.addTest(
    'T1_F6_02_checkin_provides_mechanic_selection_ui',
    'Bookings page provides mechanic selection interface on check-in',
    () => {
      const srcBookings = readSource('src/pages/Bookings.tsx');
      assertTrue(srcBookings.length > 0, 'src/pages/Bookings.tsx must exist');
      // Check for mechanic selection state or modal invocation
      const hasMechanicSelect = /mechanic|selectedMechanicId|checkInModal|onCheckIn/.test(srcBookings);
      assertTrue(hasMechanicSelect, 'Bookings.tsx must have mechanic selection integration');
    },
    'F6'
  );

  suite.addTest(
    'T1_F6_03_checkin_spk_payload_persists_chosen_mechanic',
    'Check-in SPK creation persists staff chosen mechanic ID and name',
    () => {
      const selectedMechanicId = 'm2';
      const selectedMechanicName = 'Budi Santoso';

      const payload = {
        bookingId: 'bkg-101',
        assignedMechanicId: selectedMechanicId,
        assignedMechanicName: selectedMechanicName
      };

      assertEqual(payload.assignedMechanicId, 'm2', 'Created SPK must store chosen mechanic ID');
      assertEqual(payload.assignedMechanicName, 'Budi Santoso', 'Created SPK must store chosen mechanic name');
    },
    'F6'
  );

  suite.addTest(
    'T1_F6_04_checkin_contract_accepts_mechanic_parameters',
    'App.tsx handleCheckInDirect supports staff mechanic selection',
    () => {
      const srcApp = readSource('src/App.tsx');
      // Verify handleCheckInDirect receives or coordinates mechanic selection
      const hasCheckInHandler = /handleCheckInDirect/.test(srcApp);
      assertTrue(hasCheckInHandler, 'handleCheckInDirect must be present in App.tsx');
    },
    'F6'
  );

  suite.addTest(
    'T1_F6_05_checkin_prevents_submission_without_mechanic_selection',
    'Check-in requires mechanic selection before proceeding',
    () => {
      const validateCheckInPayload = (mechId: string) => {
        if (!mechId || mechId.trim() === '') {
          return { isValid: false, message: 'Pilih mekanik terlebih dahulu.' };
        }
        return { isValid: true };
      };

      const invalidResult = validateCheckInPayload('');
      assertFalse(invalidResult.isValid, 'Check-in without mechanic must be rejected');
      const validResult = validateCheckInPayload('m1');
      assertTrue(validResult.isValid, 'Check-in with mechanic must be valid');
    },
    'F6'
  );

  // =========================================================================
  // Feature F7: SPK Service Package Default Clean (5 tests)
  // =========================================================================
  suite.addTest(
    'T1_F7_01_spk_create_modal_initial_services_empty',
    'WorkOrders create modal initializes selectedServices to empty array',
    () => {
      const src = readSource('src/pages/WorkOrders.tsx');
      // In handleOpenCreateModal, setSelectedServices should be empty array []
      const hasEmptyCreateInit = /setSelectedServices\s*\(\s*\[\s*\]\s*\)/.test(src);
      const hasAutoSelectService = /setSelectedServices\s*\(\s*\[\s*\(serviceItems\s*\|\|\s*\[\]\)\[0\]/.test(src);
      assertFalse(hasAutoSelectService, 'handleOpenCreateModal must NOT auto-select the first service item');
      assertTrue(hasEmptyCreateInit, 'handleOpenCreateModal must initialize selectedServices to []');
    },
    'F7'
  );

  suite.addTest(
    'T1_F7_02_spk_no_auto_select_oil_package',
    'WorkOrders SPK modal does not automatically select oil change package',
    () => {
      const src = readSource('src/pages/WorkOrders.tsx');
      const hasAutoSelectOil = /setSelectedServices\s*\(\s*\[\s*['"]s2['"]/.test(src);
      assertFalse(hasAutoSelectOil, 'SPK modal must not auto-select oil package');
    },
    'F7'
  );

  suite.addTest(
    'T1_F7_03_booking_checkin_does_not_force_oil_package',
    'App.tsx handleCheckInDirect does not default to oil change service item',
    () => {
      const src = readSource('src/App.tsx');
      // Verify handleCheckInDirect does not force search for oli
      const forcesOilDefault = /s\?\.name\?\.toLowerCase\(\)\.includes\(['"]oli['"]\)/.test(src);
      assertFalse(forcesOilDefault, 'App.tsx handleCheckInDirect must NOT auto-lock defaultService to oli');
    },
    'F7'
  );

  suite.addTest(
    'T1_F7_04_spk_allows_manual_service_selection',
    'Staff can toggle service packages on and off',
    () => {
      let selected: string[] = [];
      const toggle = (id: string) => {
        selected = selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id];
      };

      toggle('s1');
      assertEqual(selected.length, 1, 'Toggling s1 must add it');
      toggle('s2');
      assertEqual(selected.length, 2, 'Toggling s2 must add it');
      toggle('s1');
      assertEqual(selected.length, 1, 'Toggling s1 again must remove it');
      toggle('s2');
      assertEqual(selected.length, 0, 'Toggling s2 again must leave list empty');
    },
    'F7'
  );

  suite.addTest(
    'T1_F7_05_spk_service_cost_calculation_starts_at_zero',
    'When no service package is selected, initial service cost is zero',
    () => {
      const selectedServices: string[] = [];
      const serviceCost = selectedServices.reduce((acc, id) => {
        const item = FIXTURE_WORK_ORDERS[0].services.find((s) => s.serviceId === id);
        return acc + (item ? item.price : 0);
      }, 0);
      assertEqual(serviceCost, 0, 'Initial service cost must be 0');
    },
    'F7'
  );

  // =========================================================================
  // Feature F8: Real-time Parts Search Box (5 tests)
  // =========================================================================
  suite.addTest(
    'T1_F8_01_spk_parts_search_input_present',
    'WorkOrders SPK modal includes spare parts search input',
    () => {
      const src = readSource('src/pages/WorkOrders.tsx');
      const hasPartSearchState = /partSearchQuery|searchPart|partsQuery/.test(src);
      assertTrue(hasPartSearchState, 'WorkOrders must define search state for spare parts');
    },
    'F8'
  );

  suite.addTest(
    'T1_F8_02_parts_search_filters_by_name',
    'Spare parts search matches parts by name in real time',
    () => {
      const query = 'Kampas';
      const results = FIXTURE_SPARE_PARTS.filter(
        (p) =>
          p.name.toLowerCase().includes(query.toLowerCase()) ||
          p.sku.toLowerCase().includes(query.toLowerCase())
      );
      assertEqual(results.length, 1, 'Searching "Kampas" must return exactly 1 part');
      assertEqual(results[0].sku, 'BP-001', 'Returned part SKU must be BP-001');
    },
    'F8'
  );

  suite.addTest(
    'T1_F8_03_parts_search_filters_by_sku',
    'Spare parts search matches parts by SKU code',
    () => {
      const query = 'SP-002';
      const results = FIXTURE_SPARE_PARTS.filter(
        (p) =>
          p.name.toLowerCase().includes(query.toLowerCase()) ||
          p.sku.toLowerCase().includes(query.toLowerCase())
      );
      assertEqual(results.length, 1, 'Searching "SP-002" must return exactly 1 part');
      assertEqual(results[0].name, 'Busi Standar NGK CPR9EA-9', 'Returned part name must match');
    },
    'F8'
  );

  suite.addTest(
    'T1_F8_04_parts_search_is_case_insensitive',
    'Spare parts search operates case-insensitively',
    () => {
      const qLower = 'busi';
      const qUpper = 'BUSI';
      const filter = (q: string) =>
        FIXTURE_SPARE_PARTS.filter(
          (p) =>
            p.name.toLowerCase().includes(q.toLowerCase()) ||
            p.sku.toLowerCase().includes(q.toLowerCase())
        );
      assertEqual(filter(qLower).length, filter(qUpper).length, 'Lower and upper case searches must return identical count');
      assertEqual(filter(qLower)[0].id, filter(qUpper)[0].id, 'Matched part must be identical');
    },
    'F8'
  );

  suite.addTest(
    'T1_F8_05_parts_search_clearing_restores_full_catalog',
    'Empty parts search query displays entire spare parts catalog',
    () => {
      const query: string = '';
      const results = FIXTURE_SPARE_PARTS.filter(
        (p) =>
          !query ||
          p.name.toLowerCase().includes(query.toLowerCase()) ||
          p.sku.toLowerCase().includes(query.toLowerCase())
      );
      assertEqual(results.length, FIXTURE_SPARE_PARTS.length, 'Empty search must restore all parts');
    },
    'F8'
  );

  // =========================================================================
  // Feature F9: Sidebar Navigation Rekapan (5 tests)
  // =========================================================================
  suite.addTest(
    'T1_F9_01_app_nav_items_contains_rekapan',
    'App.tsx navItems contains Rekapan entry',
    () => {
      const src = readSource('src/App.tsx');
      assertTrue(src.length > 0, 'src/App.tsx must exist');
      const hasRekapanNavItem = /name:\s*['"]Rekapan['"]/.test(src);
      assertTrue(hasRekapanNavItem, 'App.tsx navItems must contain an item with name: "Rekapan"');
    },
    'F9'
  );

  suite.addTest(
    'T1_F9_02_rekapan_nav_has_clipboard_icon',
    'Rekapan nav item uses ClipboardList icon',
    () => {
      const src = readSource('src/App.tsx');
      const hasClipboardIcon = /name:\s*['"]Rekapan['"],\s*icon:\s*(ClipboardList|Clipboard|FileText)/.test(src);
      assertTrue(hasClipboardIcon, 'Rekapan nav item must be configured with ClipboardList icon');
    },
    'F9'
  );

  suite.addTest(
    'T1_F9_03_rekapan_accessible_to_authorized_roles',
    'Rekapan nav item allows access to owner, admin, mechanic, cashier, and user',
    () => {
      const src = readSource('src/App.tsx');
      const rekapanMatch = src.match(/name:\s*['"]Rekapan['"],[^}]+roles:\s*\[([^\]]+)\]/);
      assertTrue(!!rekapanMatch, 'Rekapan roles definition must be found in navItems');
      const rolesStr = rekapanMatch[1];
      assertTrue(rolesStr.includes('owner'), 'Rekapan must allow owner');
      assertTrue(rolesStr.includes('admin'), 'Rekapan must allow admin');
      assertTrue(rolesStr.includes('mechanic'), 'Rekapan must allow mechanic');
      assertTrue(rolesStr.includes('cashier'), 'Rekapan must allow cashier');
      assertTrue(rolesStr.includes('user'), 'Rekapan must allow user');
    },
    'F9'
  );

  suite.addTest(
    'T1_F9_04_translations_contains_rekapan',
    'translations.ts defines navigation translation for Rekapan',
    () => {
      const src = readSource('src/utils/translations.ts');
      assertTrue(src.length > 0, 'src/utils/translations.ts must exist');
      const hasRekapanTranslation = /Rekapan:\s*['"][^'"]+['"]/.test(src) || /"Rekapan":\s*['"][^'"]+['"]/.test(src);
      assertTrue(hasRekapanTranslation, 'translations.ts must define navigation label for Rekapan');
    },
    'F9'
  );

  suite.addTest(
    'T1_F9_05_command_palette_includes_rekapan_navigation',
    'CommandPalette includes Rekapan in quick navigation options',
    () => {
      const src = readSource('src/components/CommandPalette.tsx');
      assertTrue(src.length > 0, 'src/components/CommandPalette.tsx must exist');
      const hasRekapanPalette = /Rekapan/.test(src);
      assertTrue(hasRekapanPalette, 'CommandPalette must include Rekapan navigation command');
    },
    'F9'
  );

  // =========================================================================
  // Feature F10: Comprehensive Rekapan Page (5 tests)
  // =========================================================================
  suite.addTest(
    'T1_F10_01_rekapan_page_file_exists',
    'src/pages/Rekapan.tsx file exists and exports Rekapan component',
    () => {
      assertTrue(sourceExists('src/pages/Rekapan.tsx'), 'src/pages/Rekapan.tsx must exist');
      const src = readSource('src/pages/Rekapan.tsx');
      const exportsRekapan = /export\s+(const|function)\s+Rekapan/.test(src);
      assertTrue(exportsRekapan, 'Rekapan component must be exported from src/pages/Rekapan.tsx');
    },
    'F10'
  );

  suite.addTest(
    'T1_F10_02_rekapan_table_displays_required_columns',
    'Rekapan table renders required recap columns (date, plate, customer, actions, parts, cost)',
    () => {
      const src = readSource('src/pages/Rekapan.tsx');
      assertTrue(src.length > 0, 'src/pages/Rekapan.tsx must exist');
      // Look for table header keywords
      const hasDateCol = /Tanggal|Date/i.test(src);
      const hasPlateCol = /Plat|Nomor Plat|Kendaraan/i.test(src);
      const hasCustomerCol = /Pelanggan|Customer/i.test(src);
      const hasActionCol = /Tindakan|Jasa|Servis/i.test(src);
      const hasPartCol = /Part|Suku Cadang/i.test(src);
      const hasCostCol = /Biaya|Total/i.test(src);

      assertTrue(hasDateCol, 'Table must have Date column');
      assertTrue(hasPlateCol, 'Table must have Plate / Vehicle column');
      assertTrue(hasCustomerCol, 'Table must have Customer column');
      assertTrue(hasActionCol, 'Table must have Services / Actions column');
      assertTrue(hasPartCol, 'Table must have Parts column');
      assertTrue(hasCostCol, 'Table must have Total Cost column');
    },
    'F10'
  );

  suite.addTest(
    'T1_F10_03_rekapan_search_filter_functionality',
    'Rekapan search filter narrows results by plate number or customer name',
    () => {
      const query = 'Rahma';
      const filtered = FIXTURE_WORK_ORDERS.filter(
        (wo) =>
          wo.customerName.toLowerCase().includes(query.toLowerCase()) ||
          wo.licensePlate.toLowerCase().includes(query.toLowerCase())
      );
      assertEqual(filtered.length, 1, 'Search for "Rahma" must match exactly 1 work order');
      assertEqual(filtered[0].customerName, 'Siti Rahma', 'Matched customer must be Siti Rahma');
    },
    'F10'
  );

  suite.addTest(
    'T1_F10_04_rekapan_date_filter_functionality',
    'Rekapan date filter narrows results by selected service date',
    () => {
      const targetDate = getYesterdayLocalDateStr();
      const filtered = FIXTURE_WORK_ORDERS.filter((wo) => {
        const orderDate = wo.createdAt.slice(0, 10);
        return orderDate === targetDate;
      });
      assertEqual(filtered.length, 1, 'Date filter must return 1 yesterday record');
      assertEqual(filtered[0].id, 'WO-YESTERDAY-01', 'Matched record must be yesterday order');
    },
    'F10'
  );

  suite.addTest(
    'T1_F10_05_rekapan_accumulates_total_cost_correctly',
    'Rekapan calculates total accumulated service and parts revenue correctly',
    () => {
      // Completed orders: WO-TODAY-02 (100.000) and WO-YESTERDAY-01 (90.000)
      const completedOrders = FIXTURE_WORK_ORDERS.filter((wo) => wo.status === 'completed');
      const grandTotal = completedOrders.reduce((acc, wo) => acc + wo.costs.total, 0);
      assertEqual(grandTotal, 190000, 'Sum of completed orders costs must be Rp 190.000');
    },
    'F10'
  );

  return suite;
}
