import React, { useState, useMemo } from 'react';
import { useLanguage } from '../LanguageContext';
import { useCurrency } from '../CurrencyContext';
import { 
  Calculator, 
  Percent, 
  DollarSign, 
  TrendingUp, 
  ShieldAlert, 
  Building, 
  HelpCircle, 
  ChevronRight, 
  Info,
  ArrowRight,
  Sparkles,
  Layers,
  Flame,
  FileText,
  BadgeAlert,
  Wallet,
  Home,
  Briefcase
} from 'lucide-react';

export default function CalculatorHub() {
  const { t, language } = useLanguage();
  const { currency, convertPrice, formatPrice } = useCurrency();

  // Active Category / Module Selector
  const [activeTab, setActiveTab] = useState<'financing' | 'affordability' | 'transaction' | 'yields' | 'profit' | 'insurance'>('financing');

  // Multi-calculator sub-tabs per module
  const [financingSubTab, setFinancingSubTab] = useState<'loan' | 'amortization' | 'interest_savings' | 'flexi' | 'refinance' | 'early_settlement'>('loan');
  const [affordabilitySubTab, setAffordabilitySubTab] = useState<'dsr' | 'affordability'>('dsr');
  const [transactionSubTab, setTransactionSubTab] = useState<'stamp_duty' | 'buying_cost' | 'renovation' | 'rent_vs_buy'>('stamp_duty');
  const [yieldsSubTab, setYieldsSubTab] = useState<'rental' | 'airbnb' | 'risk'>('rental');
  const [profitSubTab, setProfitSubTab] = useState<'rpgt' | 'net_profit'>('rpgt');
  const [insuranceSubTab, setInsuranceSubTab] = useState<'fire' | 'mrta_mlta'>('fire');

  // --- REUSABLE CENTRAL STATE ---
  // Shared Property/Loan inputs (highly convenient for users!)
  const [propertyPrice, setPropertyPrice] = useState<number>(650000);
  const [downpaymentPercent, setDownpaymentPercent] = useState<number>(10);
  const [interestRate, setInterestRate] = useState<number>(4.2);
  const [loanTenure, setLoanTenure] = useState<number>(30);
  
  // Amortization Schedule expanded state
  const [showAmortizationAll, setShowAmortizationAll] = useState<boolean>(false);

  // Interest Savings inputs
  const [extraMonthlyPayment, setExtraMonthlyPayment] = useState<number>(300);

  // Flexi-loan inputs
  const [flexiSavingsBalance, setFlexiSavingsBalance] = useState<number>(60000);
  const [flexiMonthlyFee, setFlexiMonthlyFee] = useState<number>(10);

  // Refinancing inputs
  const [refiCurrentRate, setRefiCurrentRate] = useState<number>(4.65);
  const [refiCurrentBalance, setRefiCurrentBalance] = useState<number>(400000);
  const [refiCurrentRemainingTenure, setRefiCurrentRemainingTenure] = useState<number>(25);
  const [refiNewRate, setRefiNewRate] = useState<number>(3.85);
  const [refiCost, setRefiCost] = useState<number>(7500);

  // Early Settlement inputs
  const [earlyLoanBalance, setEarlyLoanBalance] = useState<number>(350000);
  const [earlyRemainingTenure, setEarlyRemainingTenure] = useState<number>(20);
  const [earlyLockInPeriod, setEarlyLockInPeriod] = useState<number>(3);
  const [earlyYearsStarted, setEarlyYearsStarted] = useState<number>(2);
  const [earlyPenaltyRate, setEarlyPenaltyRate] = useState<number>(2.5);

  // --- DEBT & APPROVAL STATE ---
  const [grossIncome, setGrossIncome] = useState<number>(8500);
  const [deductions, setDeductions] = useState<number>(1250); // EPF, SOCSO, Tax
  const [carLoan, setCarLoan] = useState<number>(750);
  const [personalLoan, setPersonalLoan] = useState<number>(400);
  const [creditCardMin, setCreditCardMin] = useState<number>(200);
  const [otherCommitments, setOtherCommitments] = useState<number>(150);
  const [dsrMaxRatio, setDsrMaxRatio] = useState<number>(65);

  // --- TRANSACTION COSTS STATE ---
  // SPA / MOT Legal and Valuation Cost Addons
  const [valuationRate, setValuationRate] = useState<number>(0.25);
  const [disbursementsSpa, setDisbursementsSpa] = useState<number>(1500);
  const [disbursementsLoan, setDisbursementsLoan] = useState<number>(1500);
  
  // Renovation state (itemized room budgets)
  const [renoLiving, setRenoLiving] = useState<number>(15000);
  const [renoKitchen, setRenoKitchen] = useState<number>(20000);
  const [renoBedrooms, setRenoBedrooms] = useState<number>(12000);
  const [renoBathrooms, setRenoBathrooms] = useState<number>(8000);
  const [renoAC, setRenoAC] = useState<number>(5000);
  const [renoPipingPainting, setRenoPipingPainting] = useState<number>(7000);

  // Rent vs Buy inputs
  const [rvbMonthlyRent, setRvbMonthlyRent] = useState<number>(1800);
  const [rvbRentGrowth, setRvbRentGrowth] = useState<number>(3);
  const [rvbAppreciation, setRvbAppreciation] = useState<number>(3.5);
  const [rvbAltReturn, setRvbAltReturn] = useState<number>(5.5);
  const [rvbPeriodYears, setRvbPeriodYears] = useState<number>(10);

  // --- YIELDS & INVESTMENT STATE ---
  const [expectedRent, setExpectedRent] = useState<number>(2800);
  const [annualMaintenance, setAnnualMaintenance] = useState<number>(3600);
  const [annualAssessmentQuit, setAnnualAssessmentQuit] = useState<number>(750);
  const [annualOtherExp, setAnnualOtherExp] = useState<number>(1000);

  // Airbnb specific
  const [airbnbDailyRate, setAirbnbDailyRate] = useState<number>(280);
  const [airbnbOccupancy, setAirbnbOccupancy] = useState<number>(65);
  const [airbnbPlatformFeePercent, setAirbnbPlatformFeePercent] = useState<number>(15);
  const [airbnbCleaningFee, setAirbnbCleaningFee] = useState<number>(50);
  const [airbnbBookingsCount, setAirbnbBookingsCount] = useState<number>(8); // monthly bookings
  const [airbnbMonthlyUtilities, setAirbnbMonthlyUtilities] = useState<number>(350);
  const [airbnbMonthlyManagement, setAirbnbMonthlyManagement] = useState<number>(600);

  // --- TAX & NET PROFIT STATE ---
  const [rpgtBuyingPrice, setRpgtBuyingPrice] = useState<number>(450000);
  const [rpgtSellingPrice, setRpgtSellingPrice] = useState<number>(720000);
  const [rpgtYearsHeld, setRpgtYearsHeld] = useState<number>(4);
  const [rpgtSellerType, setRpgtSellerType] = useState<'citizen' | 'foreigner' | 'company'>('citizen');
  const [rpgtPermittedExpenses, setRpgtPermittedExpenses] = useState<number>(25000); // stamp duties, commissions, reno

  // Net Gain Selling Agent fees etc
  const [sellingAgentFee, setSellingAgentFee] = useState<number>(18000);
  const [sellingLegalFee, setSellingLegalFee] = useState<number>(6000);

  // --- INSURANCE STATE ---
  const [fireSumInsured, setFireSumInsured] = useState<number>(400000);
  const [fireBaseRatePercent, setFireBaseRatePercent] = useState<number>(0.091);
  const [fireExtraContentCover, setFireExtraContentCover] = useState<number>(60);

  // MRTA vs MLTA variables
  const [borrowerAge, setBorrowerAge] = useState<number>(32);
  const [mltaMonthlyPremium, setMltaMonthlyPremium] = useState<number>(165);

  // ==========================================
  // MATHEMATICAL CALCULATIONS (MEMOIZED)
  // ==========================================

  // 1. Standard Housing Loan
  const mortgageResults = useMemo(() => {
    const loanAmount = propertyPrice * (1 - downpaymentPercent / 100);
    const monthlyRate = interestRate / 12 / 100;
    const totalMonths = loanTenure * 12;
    
    let monthlyInstallment = 0;
    if (monthlyRate > 0) {
      monthlyInstallment = loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, totalMonths)) / (Math.pow(1 + monthlyRate, totalMonths) - 1);
    } else {
      monthlyInstallment = loanAmount / totalMonths;
    }

    const totalPayment = monthlyInstallment * totalMonths;
    const totalInterest = totalPayment - loanAmount;

    return {
      loanAmount,
      monthlyInstallment,
      totalPayment,
      totalInterest,
      totalMonths
    };
  }, [propertyPrice, downpaymentPercent, interestRate, loanTenure]);

  // 2. Amortization Schedule (Year-by-year summary to conserve token limits and memory)
  const amortizationSchedule = useMemo(() => {
    const schedule: { year: number; startingBalance: number; interestPaid: number; principalPaid: number; endingBalance: number }[] = [];
    let balance = mortgageResults.loanAmount;
    const monthlyRate = interestRate / 12 / 100;
    const monthlyPayment = mortgageResults.monthlyInstallment;

    for (let year = 1; year <= loanTenure; year++) {
      let annualInterest = 0;
      let annualPrincipal = 0;
      const startingBalance = balance;

      for (let month = 1; month <= 12; month++) {
        if (balance <= 0) break;
        const interestPortion = balance * monthlyRate;
        const principalPortion = Math.min(balance, monthlyPayment - interestPortion);
        annualInterest += interestPortion;
        annualPrincipal += principalPortion;
        balance -= principalPortion;
      }

      schedule.push({
        year,
        startingBalance,
        interestPaid: annualInterest,
        principalPaid: annualPrincipal,
        endingBalance: Math.max(0, balance)
      });

      if (balance <= 0) break;
    }

    return schedule;
  }, [mortgageResults, interestRate, loanTenure]);

  // 3. Interest Savings (Adding extra payment monthly)
  const savingsResults = useMemo(() => {
    const monthlyRate = interestRate / 12 / 100;
    const monthlyPayment = mortgageResults.monthlyInstallment;
    let balance = mortgageResults.loanAmount;
    let totalStandardInterest = mortgageResults.totalInterest;

    let monthsWithExtra = 0;
    let totalInterestWithExtra = 0;
    const combinedMonthlyPayment = monthlyPayment + extraMonthlyPayment;

    while (balance > 0 && monthsWithExtra < 600) {
      const interestPortion = balance * monthlyRate;
      const principalPortion = Math.min(balance, combinedMonthlyPayment - interestPortion);
      totalInterestWithExtra += interestPortion;
      balance -= principalPortion;
      monthsWithExtra++;
    }

    const monthsSaved = Math.max(0, mortgageResults.totalMonths - monthsWithExtra);
    const yearsSaved = (monthsSaved / 12).toFixed(1);
    const interestSaved = Math.max(0, totalStandardInterest - totalInterestWithExtra);

    return {
      monthsWithExtra,
      yearsWithExtra: (monthsWithExtra / 12).toFixed(1),
      totalInterestWithExtra,
      monthsSaved,
      yearsSaved,
      interestSaved
    };
  }, [mortgageResults, extraMonthlyPayment, interestRate]);

  // 4. Full-Flexi vs Semi-Flexi
  const flexiComparison = useMemo(() => {
    const loanAmount = mortgageResults.loanAmount;
    const monthlyRate = interestRate / 12 / 100;
    const standardPayment = mortgageResults.monthlyInstallment;
    
    // In Semi-Flexi, let's assume no systematic offset is being done.
    // In Full-Flexi, interest is computed monthly on (Principal Outstanding - Savings Balance)
    // Factoring in the flexi monthly fee over the entire tenure
    let balanceFull = loanAmount;
    let balanceSemi = loanAmount;
    let totalInterestFull = 0;
    let totalInterestSemi = 0;
    let monthsFull = 0;

    const totalMonths = loanTenure * 12;

    // We model interest accumulated with savings balance offset
    for (let m = 1; m <= totalMonths; m++) {
      // Semi-Flexi (assuming standard amortization)
      if (balanceSemi > 0) {
        const intSemi = balanceSemi * monthlyRate;
        totalInterestSemi += intSemi;
        balanceSemi -= Math.min(balanceSemi, standardPayment - intSemi);
      }

      // Full-Flexi (interest offset by parked savings balance)
      if (balanceFull > 0) {
        const offsetBalance = Math.max(0, balanceFull - flexiSavingsBalance);
        const intFull = offsetBalance * monthlyRate;
        totalInterestFull += intFull;
        balanceFull -= Math.min(balanceFull, standardPayment - intFull);
        monthsFull++;
      }
    }

    const flexiTotalFees = flexiMonthlyFee * loanTenure * 12;
    const netSavings = totalInterestSemi - totalInterestFull - flexiTotalFees;

    return {
      totalInterestSemi,
      totalInterestFull,
      flexiTotalFees,
      netSavings,
      isAdvised: netSavings > 0
    };
  }, [mortgageResults, flexiSavingsBalance, flexiMonthlyFee, interestRate, loanTenure]);

  // 5. Refinancing Savings
  const refinanceResults = useMemo(() => {
    // Current loan monthly installment
    const currentMonthlyRate = refiCurrentRate / 12 / 100;
    const currentTotalMonths = refiCurrentRemainingTenure * 12;
    const currentMonthlyInstallment = refiCurrentBalance * (currentMonthlyRate * Math.pow(1 + currentMonthlyRate, currentTotalMonths)) / (Math.pow(1 + currentMonthlyRate, currentTotalMonths) - 1);
    const currentTotalInterest = (currentMonthlyInstallment * currentTotalMonths) - refiCurrentBalance;

    // Refinanced loan monthly installment
    const newMonthlyRate = refiNewRate / 12 / 100;
    const newMonthlyInstallment = refiCurrentBalance * (newMonthlyRate * Math.pow(1 + newMonthlyRate, currentTotalMonths)) / (Math.pow(1 + newMonthlyRate, currentTotalMonths) - 1);
    const newTotalInterest = (newMonthlyInstallment * currentTotalMonths) - refiCurrentBalance;

    const monthlySavings = Math.max(0, currentMonthlyInstallment - newMonthlyInstallment);
    const grossLifetimeSavings = Math.max(0, currentTotalInterest - newTotalInterest);
    const netLifetimeSavings = Math.max(0, grossLifetimeSavings - refiCost);
    const breakEvenMonths = monthlySavings > 0 ? Math.ceil(refiCost / monthlySavings) : 999;

    return {
      currentMonthlyInstallment,
      newMonthlyInstallment,
      monthlySavings,
      grossLifetimeSavings,
      netLifetimeSavings,
      breakEvenMonths
    };
  }, [refiCurrentBalance, refiCurrentRate, refiCurrentRemainingTenure, refiNewRate, refiCost]);

  // 6. Early Settlement Lock-in Evaluator
  const earlySettlementResults = useMemo(() => {
    const penaltyPaid = earlyYearsStarted < earlyLockInPeriod ? (earlyLoanBalance * (earlyPenaltyRate / 100)) : 0;
    
    // Total interest saved is roughly estimated based on current remaining schedule interest
    const monthlyRate = interestRate / 12 / 100;
    const totalMonths = earlyRemainingTenure * 12;
    
    // Standard installment
    const installment = earlyLoanBalance * (monthlyRate * Math.pow(1 + monthlyRate, totalMonths)) / (Math.pow(1 + monthlyRate, totalMonths) - 1);
    const totalRemainingPayments = installment * totalMonths;
    const interestToBeSaved = Math.max(0, totalRemainingPayments - earlyLoanBalance);

    const netSavings = Math.max(0, interestToBeSaved - penaltyPaid);

    return {
      penaltyPaid,
      interestToBeSaved,
      netSavings,
      penaltyApplies: earlyYearsStarted < earlyLockInPeriod
    };
  }, [earlyLoanBalance, earlyRemainingTenure, interestRate, earlyYearsStarted, earlyLockInPeriod, earlyPenaltyRate]);

  // 7. DSR Calculator
  const dsrResults = useMemo(() => {
    const netIncome = grossIncome - deductions;
    const totalCommitments = mortgageResults.monthlyInstallment + carLoan + personalLoan + creditCardMin + otherCommitments;
    const currentDsr = netIncome > 0 ? (totalCommitments / netIncome) * 100 : 0;

    let verdict = 'Approved';
    let verdictColor = 'text-green-600';
    let bgVerdictColor = 'bg-green-50 border-green-100';
    
    if (currentDsr > dsrMaxRatio + 5) {
      verdict = 'Rejected';
      verdictColor = 'text-rose-600';
      bgVerdictColor = 'bg-rose-50 border-rose-100';
    } else if (currentDsr > dsrMaxRatio - 5) {
      verdict = 'Borderline / Warning';
      verdictColor = 'text-amber-600';
      bgVerdictColor = 'bg-amber-50 border-amber-100';
    }

    return {
      netIncome,
      totalCommitments,
      currentDsr,
      verdict,
      verdictColor,
      bgVerdictColor
    };
  }, [grossIncome, deductions, mortgageResults.monthlyInstallment, carLoan, personalLoan, creditCardMin, otherCommitments, dsrMaxRatio]);

  // 8. Loan Affordability
  const loanAffordabilityResults = useMemo(() => {
    const netIncome = grossIncome - deductions;
    const maxAllowedCommitment = netIncome * (dsrMaxRatio / 100);
    const existingCommitments = carLoan + personalLoan + creditCardMin + otherCommitments;
    const maxNewInstallment = Math.max(0, maxAllowedCommitment - existingCommitments);

    // Calculate maximum loan based on max installment
    const monthlyRate = interestRate / 12 / 100;
    const totalMonths = loanTenure * 12;

    let maxLoanAmount = 0;
    if (monthlyRate > 0 && maxNewInstallment > 0) {
      maxLoanAmount = maxNewInstallment * (Math.pow(1 + monthlyRate, totalMonths) - 1) / (monthlyRate * Math.pow(1 + monthlyRate, totalMonths));
    } else {
      maxLoanAmount = maxNewInstallment * totalMonths;
    }

    const estimatedPropertyPrice = maxLoanAmount / (1 - downpaymentPercent / 100);

    return {
      maxNewInstallment,
      maxLoanAmount,
      estimatedPropertyPrice
    };
  }, [grossIncome, deductions, dsrMaxRatio, carLoan, personalLoan, creditCardMin, otherCommitments, interestRate, loanTenure, downpaymentPercent]);

  // 9. Stamp Duty & Legal Fee
  const transactionFees = useMemo(() => {
    const price = propertyPrice;
    const loan = mortgageResults.loanAmount;

    // --- MOT Stamp Duty (Tiered Scale in Malaysia) ---
    // First 100,000 : 1%
    // 100,001 - 500,000 : 2%
    // 500,001 - 1,000,000 : 3%
    // Above 1,000,000 : 4%
    let stampDutyMot = 0;
    if (price <= 100000) {
      stampDutyMot = price * 0.01;
    } else if (price <= 500000) {
      stampDutyMot = (100000 * 0.01) + ((price - 100000) * 0.02);
    } else if (price <= 1000000) {
      stampDutyMot = (100000 * 0.01) + (400000 * 0.02) + ((price - 500000) * 0.03);
    } else {
      stampDutyMot = (100000 * 0.01) + (400000 * 0.02) + (500000 * 0.03) + ((price - 1000000) * 0.04);
    }

    // --- SPA Legal Fee (SRO 2023 Scale) ---
    // First 500,000 : 1.25% (Min RM1,250)
    // Next 500,000 (up to 1,000,000) : 1%
    // Beyond 1,000,000 : 0.9%
    let spaLegalFee = 0;
    if (price <= 500000) {
      spaLegalFee = Math.max(1250, price * 0.0125);
    } else if (price <= 1000000) {
      spaLegalFee = (500000 * 0.0125) + ((price - 500000) * 0.01);
    } else {
      spaLegalFee = (500000 * 0.0125) + (500000 * 0.01) + ((price - 1000000) * 0.009);
    }

    // --- Loan Stamp Duty (0.5% flat) ---
    const loanStampDuty = loan * 0.005;

    // --- Loan Legal Fee (typically mirrors SPA legal fee scale) ---
    let loanLegalFee = 0;
    if (loan <= 500000) {
      loanLegalFee = Math.max(1250, loan * 0.0125);
    } else if (loan <= 1000000) {
      loanLegalFee = (500000 * 0.0125) + ((loan - 500000) * 0.01);
    } else {
      loanLegalFee = (500000 * 0.0125) + (500000 * 0.01) + ((loan - 1000000) * 0.009);
    }

    const totalTransactionFees = stampDutyMot + spaLegalFee + loanStampDuty + loanLegalFee;

    return {
      stampDutyMot,
      spaLegalFee,
      loanStampDuty,
      loanLegalFee,
      totalTransactionFees
    };
  }, [propertyPrice, mortgageResults.loanAmount]);

  // 10. Total Buying Cost
  const totalBuyingCostResults = useMemo(() => {
    const downpayment = propertyPrice * (downpaymentPercent / 100);
    const valuationFee = propertyPrice * (valuationRate / 100);
    
    const cashRequired = 
      downpayment + 
      transactionFees.stampDutyMot + 
      transactionFees.spaLegalFee + 
      disbursementsSpa + 
      transactionFees.loanStampDuty + 
      transactionFees.loanLegalFee + 
      disbursementsLoan + 
      valuationFee;

    return {
      downpayment,
      valuationFee,
      cashRequired
    };
  }, [propertyPrice, downpaymentPercent, transactionFees, valuationRate, disbursementsSpa, disbursementsLoan]);

  // 11. Renovation Budget Sum
  const totalRenovationCost = useMemo(() => {
    return renoLiving + renoKitchen + renoBedrooms + renoBathrooms + renoAC + renoPipingPainting;
  }, [renoLiving, renoKitchen, renoBedrooms, renoBathrooms, renoAC, renoPipingPainting]);

  // 12. Rent vs Buy Financial Comparison
  const rentVsBuyResults = useMemo(() => {
    const years = rvbPeriodYears;
    const altInvestRate = rvbAltReturn / 100;
    const propertyApprecRate = rvbAppreciation / 100;
    const rentGrowthRate = rvbRentGrowth / 100;

    // SCENARIO 1: BUYING (Asset Accumulation & Cost)
    // Downpayment + Transaction Costs invested initially in BUYING instead
    const initialBuyingCash = totalBuyingCostResults.cashRequired;
    const endPropertyValue = propertyPrice * Math.pow(1 + propertyApprecRate, years);
    
    // Remaining loan balance at end of Year X
    const endLoanBalance = amortizationSchedule[Math.min(years, amortizationSchedule.length) - 1]?.endingBalance || 0;
    const buyingNetWorth = endPropertyValue - endLoanBalance - (endPropertyValue * 0.03); // deduct 3% selling cost

    // SCENARIO 2: RENTING (Alt investment grows)
    // Park the entire initial buying cash into the alternative investment
    let rentingInvestValue = initialBuyingCash;
    let currentRent = rvbMonthlyRent;
    let totalRentPaid = 0;

    for (let yr = 1; yr <= years; yr++) {
      // Compounded alternative return on current pot
      rentingInvestValue = rentingInvestValue * (1 + altInvestRate);
      
      // Also, difference between Monthly Buying Outflow (Mortgage + Maintenance) vs Rent is invested
      const annualMortgageAndMaint = (mortgageResults.monthlyInstallment + (annualMaintenance / 12)) * 12;
      const annualRent = currentRent * 12;
      totalRentPaid += annualRent;

      const annualOutflowDiff = annualMortgageAndMaint - annualRent;
      if (annualOutflowDiff > 0) {
        // Renting is cheaper than buying out-of-pocket, so invest the savings!
        rentingInvestValue += annualOutflowDiff * Math.pow(1 + altInvestRate, 0.5); // mid-year compounding approximation
      }

      currentRent = currentRent * (1 + rentGrowthRate);
    }

    const netAdvantage = Math.abs(buyingNetWorth - rentingInvestValue);
    const buyerWins = buyingNetWorth > rentingInvestValue;

    return {
      buyingNetWorth,
      rentingInvestValue,
      totalRentPaid,
      netAdvantage,
      buyerWins
    };
  }, [rvbPeriodYears, rvbAltReturn, rvbAppreciation, rvbRentGrowth, totalBuyingCostResults, propertyPrice, rvbMonthlyRent, mortgageResults, annualMaintenance, amortizationSchedule]);

  // 13. Rental Yield
  const rentalYieldResults = useMemo(() => {
    const grossRevenue = expectedRent * 12;
    const totalOutgoings = annualMaintenance + annualAssessmentQuit + annualOtherExp;
    const netRevenue = grossRevenue - totalOutgoings;

    const grossYield = (grossRevenue / propertyPrice) * 100;
    const netYield = propertyPrice > 0 ? (netRevenue / propertyPrice) * 100 : 0;

    return {
      grossRevenue,
      totalOutgoings,
      netRevenue,
      grossYield,
      netYield
    };
  }, [expectedRent, annualMaintenance, annualAssessmentQuit, annualOtherExp, propertyPrice]);

  // 14. Airbnb Short-Term Yield
  const airbnbYieldResults = useMemo(() => {
    const activeNightsPerYear = (airbnbOccupancy / 100) * 365;
    
    // Revenue calculations
    const grossNightsRevenue = activeNightsPerYear * airbnbDailyRate;
    const platformCommissions = grossNightsRevenue * (airbnbPlatformFeePercent / 100);
    const platformNetRevenue = grossNightsRevenue - platformCommissions;

    // Booking counts & cleaning fees (guest paid, but we treat inside operations or net)
    const annualCleaningRevenue = airbnbCleaningFee * airbnbBookingsCount * 12;
    const annualGrossAirbnbRevenue = platformNetRevenue + annualCleaningRevenue;

    // Expenses
    const annualUtilities = airbnbMonthlyUtilities * 12;
    const annualManagementFees = airbnbMonthlyManagement * 12;
    const annualAirbnbMaint = annualMaintenance; // shared input

    const totalAirbnbExpenses = annualUtilities + annualManagementFees + annualAirbnbMaint + annualCleaningRevenue;
    const netAirbnbIncome = Math.max(0, annualGrossAirbnbRevenue - totalAirbnbExpenses);

    const netAirbnbYield = propertyPrice > 0 ? (netAirbnbIncome / propertyPrice) * 100 : 0;

    return {
      activeNightsPerYear: Math.round(activeNightsPerYear),
      annualGrossAirbnbRevenue,
      totalAirbnbExpenses,
      netAirbnbIncome,
      netAirbnbYield
    };
  }, [airbnbOccupancy, airbnbDailyRate, airbnbPlatformFeePercent, airbnbCleaningFee, airbnbBookingsCount, airbnbMonthlyUtilities, airbnbMonthlyManagement, annualMaintenance, propertyPrice]);

  // 15. Cash Flow & Risk Metric
  const riskCashFlowResults = useMemo(() => {
    const monthlyNetOperatingIncome = rentalYieldResults.netRevenue / 12;
    const monthlyMortgage = mortgageResults.monthlyInstallment;
    const monthlyCashFlow = monthlyNetOperatingIncome - monthlyMortgage;
    const annualCashFlow = monthlyCashFlow * 12;

    const initialCashOutlay = totalBuyingCostResults.cashRequired;
    const cashOnCashReturn = initialCashOutlay > 0 ? (annualCashFlow / initialCashOutlay) * 100 : 0;

    // DSCR
    const dscr = monthlyMortgage > 0 ? (monthlyNetOperatingIncome / monthlyMortgage) : 0;
    const capRate = propertyPrice > 0 ? (rentalYieldResults.netRevenue / propertyPrice) * 100 : 0;

    return {
      monthlyCashFlow,
      annualCashFlow,
      cashOnCashReturn,
      dscr,
      capRate
    };
  }, [rentalYieldResults, mortgageResults, totalBuyingCostResults, propertyPrice]);

  // 16. RPGT (Real Property Gains Tax) Estimator
  const rpgtResults = useMemo(() => {
    const buyingCostTotal = rpgtBuyingPrice;
    const grossGain = rpgtSellingPrice - buyingCostTotal - rpgtPermittedExpenses;
    
    // Malaysian individual exemption: standard 10% of gain or RM10,000 (whichever is higher)
    const individualExemption = rpgtSellerType === 'citizen' ? Math.max(10000, grossGain * 0.1) : 0;
    const netTaxableGain = Math.max(0, grossGain - individualExemption);

    // Dynamic Tiered Rate based on holding years
    let rate = 0;
    if (rpgtSellerType === 'citizen') {
      if (rpgtYearsHeld <= 3) rate = 30;
      else if (rpgtYearsHeld === 4) rate = 20;
      else if (rpgtYearsHeld === 5) rate = 15;
      else rate = 0; // After 5 years, citizen individual pays 0%
    } else if (rpgtSellerType === 'foreigner') {
      if (rpgtYearsHeld <= 5) rate = 30;
      else rate = 10; // After 5 years, foreigners pay 10%
    } else {
      // Company rate
      if (rpgtYearsHeld <= 3) rate = 30;
      else if (rpgtYearsHeld === 4) rate = 20;
      else if (rpgtYearsHeld === 5) rate = 15;
      else rate = 10;
    }

    const taxPayable = netTaxableGain * (rate / 100);

    return {
      grossGain,
      individualExemption,
      netTaxableGain,
      rate,
      taxPayable
    };
  }, [rpgtBuyingPrice, rpgtSellingPrice, rpgtPermittedExpenses, rpgtSellerType, rpgtYearsHeld]);

  // 17. Property Gain / Net Profit
  const netProfitResults = useMemo(() => {
    const grossProfit = rpgtSellingPrice - rpgtBuyingPrice;
    const totalTransactionAndHoldingCosts = 
      totalBuyingCostResults.cashRequired - (rpgtBuyingPrice * (downpaymentPercent / 100)) + // upfront fees
      sellingAgentFee + 
      sellingLegalFee + 
      totalRenovationCost;

    const netProfitValue = grossProfit - totalTransactionAndHoldingCosts - rpgtResults.taxPayable;
    const roiPercent = totalBuyingCostResults.cashRequired > 0 ? (netProfitValue / totalBuyingCostResults.cashRequired) * 100 : 0;

    return {
      grossProfit,
      totalCosts: totalTransactionAndHoldingCosts,
      netProfitValue,
      roiPercent
    };
  }, [rpgtSellingPrice, rpgtBuyingPrice, totalBuyingCostResults, downpaymentPercent, sellingAgentFee, sellingLegalFee, totalRenovationCost, rpgtResults]);

  // 18. Fire Insurance Premium
  const firePremiumResults = useMemo(() => {
    const annualBasePremium = fireSumInsured * (fireBaseRatePercent / 100);
    const serviceTax = annualBasePremium * 0.08; // 8% Service tax in Malaysia
    const stampDuty = 10.0; // flat stamp duty
    const totalPremium = annualBasePremium + serviceTax + stampDuty + fireExtraContentCover;

    return {
      annualBasePremium,
      serviceTax,
      totalPremium
    };
  }, [fireSumInsured, fireBaseRatePercent, fireExtraContentCover]);

  // 19. MRTA vs MLTA premium comparison models
  const insuranceCompareResults = useMemo(() => {
    // Estimations derived from standard industry quotes for Malaysian borrowers
    const mrtaSinglePremiumEst = Math.max(3500, (mortgageResults.loanAmount * (0.02 + (borrowerAge - 20) * 0.001)));
    const mrtaFinancedMonthlyAddon = mrtaSinglePremiumEst / (loanTenure * 12) * 1.3; // factors in financed interest

    const mltaAnnualPremiumSum = mltaMonthlyPremium * 12;
    const mlta30YearTotalPayments = mltaAnnualPremiumSum * loanTenure;
    const mltaGuaranteedCashValue = mlta30YearTotalPayments * 0.65; // standard cash value accrual factor

    return {
      mrtaSinglePremiumEst,
      mrtaFinancedMonthlyAddon,
      mltaAnnualPremiumSum,
      mlta30YearTotalPayments,
      mltaGuaranteedCashValue,
      mltaNetCost: Math.max(0, mlta30YearTotalPayments - mltaGuaranteedCashValue)
    };
  }, [mortgageResults.loanAmount, borrowerAge, loanTenure, mltaMonthlyPremium]);


  // ==========================================
  // TRANSLATION HELPER (In-line dictionary)
  // ==========================================
  const translateKey = (key: string) => {
    const dictionary: Record<string, Record<string, string>> = {
      calculatorHubTitle: {
        en: 'Advanced Property Calculator Hub',
        'zh-CN': '马来西亚高级房产金融计算器中心',
        'zh-TW': '馬來西亞高級房產金融計算器中心',
        ja: 'マレーシア不動産シミュレーションハブ',
        ko: '말레이시아 고급 부동산 계산기 허브'
      },
      calculatorHubDesc: {
        en: 'Make confident, data-backed decisions. Formulated using official Malaysian stamp duty schedules, bank DSR parameters, and advanced amortization formulas.',
        'zh-CN': '利用马来西亚官方印花税率、银行债务还款比率（DSR）及精算还贷公式，助您做出科学、受数据支持的投资决策。',
        'zh-TW': '利用馬來西亞官方印花稅率、銀行債務還款比率（DSR）及精算還貸公式，助您做出科學、受數據支持的投資決策。',
        ja: 'マレーシア公式の印花税（スタンプデューティ）、銀行DSR審査、返済計画書、税制（RPGT）に対応したプロ仕様の財務分析ツール。',
        ko: '말레이시아 공식 인지세율, 은행 부채 상환 비율(DSR) 및 모기지 상환 공식을 사용한 정밀 시뮬레이터.'
      },
      propertyInputs: {
        en: 'Primary Property Inputs',
        'zh-CN': '核心物业与贷款参数设定',
        'zh-TW': '核心物業與貸款參數設定',
        ja: '物件・ローン基本入力'
      },
      propPriceLabel: {
        en: 'Property Purchase Price',
        'zh-CN': '物业购买总价',
        'zh-TW': '物業購買總價',
        ja: '物件購入価格'
      },
      downpaymentLabel: {
        en: 'Downpayment',
        'zh-CN': '首付比例',
        'zh-TW': '首付比例',
        ja: '頭金割合'
      },
      interestRateLabel: {
        en: 'Annual Interest Rate',
        'zh-CN': '年贷款利率',
        'zh-TW': '年貸款利率',
        ja: 'ローン年利率'
      },
      tenureLabel: {
        en: 'Loan Tenure (Years)',
        'zh-CN': '还款年限',
        'zh-TW': '還款年限',
        ja: '借入期間 (年)'
      }
    };

    const group = dictionary[key];
    if (!group) return key;
    return group[language] || group['en'];
  };

  return (
    <div className="bg-slate-50/50 min-h-screen py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        
        {/* Hub Header */}
        <div className="text-center max-w-4xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-50 border border-orange-100 text-orange-600 text-xs font-bold tracking-wider uppercase">
            <Sparkles className="h-3 w-3" />
            Empowering Smart Real Estate Decisions
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-[42px] font-black tracking-tight text-slate-900 leading-none">
            {translateKey('calculatorHubTitle')}
          </h1>
          <p className="text-slate-500 text-sm sm:text-base leading-relaxed font-medium">
            {translateKey('calculatorHubDesc')}
          </p>
        </div>

        {/* Categories Tab Navigation Bar */}
        <div className="bg-white p-2 rounded-2xl border border-slate-100 shadow-xs grid grid-cols-3 md:grid-cols-6 gap-1 max-w-5xl mx-auto">
          {[
            { id: 'financing', label: language.startsWith('zh') ? '融资贷款' : language === 'ja' ? '資金・返済' : 'Financing & Loan', icon: Calculator },
            { id: 'affordability', label: language.startsWith('zh') ? '限额预估' : language === 'ja' ? '融資限度' : 'Affordability', icon: ShieldAlert },
            { id: 'transaction', label: language.startsWith('zh') ? '交易成本' : language === 'ja' ? '諸経費・工費' : 'Purchase Cost', icon: Wallet },
            { id: 'yields', label: language.startsWith('zh') ? '租金收益' : language === 'ja' ? '収益性・利回り' : 'Rental Yields', icon: TrendingUp },
            { id: 'profit', label: language.startsWith('zh') ? '税费净利' : language === 'ja' ? '譲渡税・純益' : 'Taxes & Gains', icon: Briefcase },
            { id: 'insurance', label: language.startsWith('zh') ? '保险防范' : language === 'ja' ? '保険・保障' : 'Insurance', icon: Home }
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex flex-col sm:flex-row items-center justify-center gap-1.5 py-3 px-2 sm:px-3 rounded-xl text-xs font-bold tracking-tight transition-all cursor-pointer ${
                  active 
                    ? 'bg-slate-900 text-white shadow-md' 
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="text-center sm:text-left leading-none">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Master Content Screen Splitter */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT COLUMN: SHARED VALUE CONTROLLER PANELS (Depends on Category for Context) */}
          <div className="lg:col-span-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6">
            <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-widest border-b border-slate-100 pb-3 flex items-center gap-2">
              <Layers className="h-4 w-4 text-orange-500" />
              {translateKey('propertyInputs')}
            </h2>

            {/* Contextual Controller Form fields based on active tab */}
            {(activeTab === 'financing' || activeTab === 'transaction' || activeTab === 'yields') && (
              <div className="space-y-5">
                {/* Property Price */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <label className="font-bold text-slate-700">{translateKey('propPriceLabel')}</label>
                    <span className="font-black ig-text bg-orange-50 px-2.5 py-1 rounded-md">{formatPrice(propertyPrice)}</span>
                  </div>
                  <input 
                    type="range" 
                    min={200000} 
                    max={3000000} 
                    step={10000} 
                    value={propertyPrice} 
                    onChange={(e) => setPropertyPrice(Number(e.target.value))}
                    className="w-full accent-orange-500 h-1.5 bg-slate-100 rounded-lg cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 font-bold">
                    <span>{formatPrice(200000)}</span>
                    <span>{formatPrice(3000000)}</span>
                  </div>
                </div>

                {/* Downpayment Percent */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <label className="font-bold text-slate-700">{translateKey('downpaymentLabel')}</label>
                    <span className="font-black text-slate-800 bg-slate-50 px-2 py-0.5 rounded-md">
                      {downpaymentPercent}% ({formatPrice(propertyPrice * (downpaymentPercent / 100))})
                    </span>
                  </div>
                  <input 
                    type="range" 
                    min={0} 
                    max={50} 
                    step={5} 
                    value={downpaymentPercent} 
                    onChange={(e) => setDownpaymentPercent(Number(e.target.value))}
                    className="w-full accent-orange-500 h-1.5 bg-slate-100 rounded-lg cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 font-bold">
                    <span>0% (Full Loan)</span>
                    <span>50%</span>
                  </div>
                </div>

                {/* Interest Rate */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <label className="font-bold text-slate-700">{translateKey('interestRateLabel')}</label>
                    <span className="font-black text-slate-800 bg-slate-50 px-2 py-0.5 rounded-md">{interestRate}% p.a.</span>
                  </div>
                  <input 
                    type="range" 
                    min={2.5} 
                    max={7.0} 
                    step={0.05} 
                    value={interestRate} 
                    onChange={(e) => setInterestRate(Number(e.target.value))}
                    className="w-full accent-orange-500 h-1.5 bg-slate-100 rounded-lg cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 font-bold">
                    <span>2.5%</span>
                    <span>7.0%</span>
                  </div>
                </div>

                {/* Loan Tenure */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <label className="font-bold text-slate-700">{translateKey('tenureLabel')}</label>
                    <span className="font-black text-slate-800 bg-slate-50 px-2 py-0.5 rounded-md">{loanTenure} {language.startsWith('zh') ? '年' : 'Years'}</span>
                  </div>
                  <input 
                    type="range" 
                    min={5} 
                    max={35} 
                    step={1} 
                    value={loanTenure} 
                    onChange={(e) => setLoanTenure(Number(e.target.value))}
                    className="w-full accent-orange-500 h-1.5 bg-slate-100 rounded-lg cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 font-bold">
                    <span>5 {language.startsWith('zh') ? '年' : 'years'}</span>
                    <span>35 {language.startsWith('zh') ? '年' : 'years'}</span>
                  </div>
                </div>

                {/* Context Tip Box */}
                <div className="p-3 bg-orange-50/50 rounded-xl border border-orange-100/50 flex gap-2.5">
                  <Info className="h-4.5 w-4.5 text-orange-500 shrink-0 mt-0.5" />
                  <p className="text-[11px] text-slate-600 leading-relaxed font-medium">
                    {language.startsWith('zh') 
                      ? '马来西亚商业银行目前的平均住房按揭利率约在 3.8% 至 4.4% 之间，标准最长贷款期限为 35 年或到借款人 70 岁。'
                      : 'Standard home loan interest rates in Malaysia currently range between 3.8% to 4.4% p.a. Maximum allowable tenure is 35 years.'}
                  </p>
                </div>
              </div>
            )}

            {/* Affordability Input Controllers */}
            {activeTab === 'affordability' && (
              <div className="space-y-5">
                {/* Gross Monthly Income */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <label className="font-bold text-slate-700">{language.startsWith('zh') ? '税前月收入 (Gross Income)' : 'Gross Monthly Income'}</label>
                    <span className="font-black text-slate-800 bg-slate-50 px-2.5 py-1 rounded-md">{formatPrice(grossIncome)}</span>
                  </div>
                  <input 
                    type="range" 
                    min={2000} 
                    max={40000} 
                    step={250} 
                    value={grossIncome} 
                    onChange={(e) => setGrossIncome(Number(e.target.value))}
                    className="w-full accent-orange-500 h-1.5 bg-slate-100 rounded-lg cursor-pointer"
                  />
                </div>

                {/* EPF / Tax Deductions */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <label className="font-bold text-slate-700">{language.startsWith('zh') ? '每个月法定扣减额 (公积金/税收)' : 'EPF, SOCSO & Income Tax'}</label>
                    <span className="font-black text-slate-800 bg-slate-50 px-2.5 py-1 rounded-md">{formatPrice(deductions)}</span>
                  </div>
                  <input 
                    type="range" 
                    min={200} 
                    max={10000} 
                    step={100} 
                    value={deductions} 
                    onChange={(e) => setDeductions(Number(e.target.value))}
                    className="w-full accent-orange-500 h-1.5 bg-slate-100 rounded-lg cursor-pointer"
                  />
                </div>

                {/* Commitments Panel */}
                <div className="pt-4 border-t border-slate-100 space-y-4">
                  <span className="text-xs font-black text-slate-400 uppercase tracking-widest block">Existing Monthly Debt commitments</span>
                  
                  {/* Car Loan */}
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-xs text-slate-600 font-bold">{language.startsWith('zh') ? '汽车贷款 (Car Loan)' : 'Car Loan Monthly Payment'}</span>
                    <input 
                      type="number"
                      value={carLoan}
                      onChange={(e) => setCarLoan(Number(e.target.value))}
                      className="w-24 px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-right"
                    />
                  </div>

                  {/* Personal Loan */}
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-xs text-slate-600 font-bold">{language.startsWith('zh') ? '个人/教育贷款 (Personal/PTPTN)' : 'Personal / Student Loan'}</span>
                    <input 
                      type="number"
                      value={personalLoan}
                      onChange={(e) => setPersonalLoan(Number(e.target.value))}
                      className="w-24 px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-right"
                    />
                  </div>

                  {/* Credit Card Min */}
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-xs text-slate-600 font-bold">{language.startsWith('zh') ? '信用卡最低还款 (Credit Cards)' : 'Credit Card Min Payment'}</span>
                    <input 
                      type="number"
                      value={creditCardMin}
                      onChange={(e) => setCreditCardMin(Number(e.target.value))}
                      className="w-24 px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-right"
                    />
                  </div>

                  {/* Limit DSR Slider */}
                  <div className="space-y-2 pt-2">
                    <div className="flex justify-between items-center text-xs">
                      <label className="font-bold text-slate-600">{language.startsWith('zh') ? '最高允许 DSR % (银行红线)' : 'Max Target DSR Limit %'}</label>
                      <span className="font-black text-orange-600 bg-orange-50 px-2 py-0.5 rounded-md">{dsrMaxRatio}%</span>
                    </div>
                    <input 
                      type="range" 
                      min={50} 
                      max={85} 
                      step={5} 
                      value={dsrMaxRatio} 
                      onChange={(e) => setDsrMaxRatio(Number(e.target.value))}
                      className="w-full accent-orange-500 h-1 bg-slate-100 rounded-lg cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Profit / RPGT Controllers */}
            {activeTab === 'profit' && (
              <div className="space-y-5">
                {/* RPGT Original Price */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <label className="font-bold text-slate-700">{language.startsWith('zh') ? '原物业购入总价' : 'Original Purchase Price'}</label>
                    <span className="font-black text-slate-800 bg-slate-50 px-2.5 py-1 rounded-md">{formatPrice(rpgtBuyingPrice)}</span>
                  </div>
                  <input 
                    type="range" 
                    min={150000} 
                    max={2000000} 
                    step={10000} 
                    value={rpgtBuyingPrice} 
                    onChange={(e) => {
                      setRpgtBuyingPrice(Number(e.target.value));
                      // Sync to standard price to maintain consistency
                      setPropertyPrice(Number(e.target.value));
                    }}
                    className="w-full accent-orange-500 h-1.5 bg-slate-100 rounded-lg cursor-pointer"
                  />
                </div>

                {/* RPGT Selling Price */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <label className="font-bold text-slate-700">{language.startsWith('zh') ? '预计房屋售出总价' : 'Projected Selling Price'}</label>
                    <span className="font-black text-orange-600 bg-orange-50 px-2.5 py-1 rounded-md">{formatPrice(rpgtSellingPrice)}</span>
                  </div>
                  <input 
                    type="range" 
                    min={200000} 
                    max={3000000} 
                    step={10000} 
                    value={rpgtSellingPrice} 
                    onChange={(e) => setRpgtSellingPrice(Number(e.target.value))}
                    className="w-full accent-orange-500 h-1.5 bg-slate-100 rounded-lg cursor-pointer"
                  />
                </div>

                {/* RPGT Years Held */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <label className="font-bold text-slate-700">{language.startsWith('zh') ? '购入至出售的持房年限' : 'Holding Period (Years)'}</label>
                    <span className="font-black text-slate-800 bg-slate-50 px-2.5 py-1 rounded-md">{rpgtYearsHeld} {language.startsWith('zh') ? '年' : 'Years'}</span>
                  </div>
                  <input 
                    type="range" 
                    min={1} 
                    max={10} 
                    step={1} 
                    value={rpgtYearsHeld} 
                    onChange={(e) => setRpgtYearsHeld(Number(e.target.value))}
                    className="w-full accent-orange-500 h-1.5 bg-slate-100 rounded-lg cursor-pointer"
                  />
                </div>

                {/* Seller Profile Type */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-700">{language.startsWith('zh') ? '卖家身份类别 (决定税率)' : 'Seller Legal Entity Category'}</label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {[
                      { id: 'citizen', label: language.startsWith('zh') ? '大马公民' : 'Citizen / PR' },
                      { id: 'foreigner', label: language.startsWith('zh') ? '外国买家' : 'Foreigner' },
                      { id: 'company', label: language.startsWith('zh') ? '投资公司' : 'Company' }
                    ].map((type) => (
                      <button
                        key={type.id}
                        onClick={() => setRpgtSellerType(type.id as any)}
                        className={`py-2 text-[11px] font-bold rounded-lg border transition-all cursor-pointer ${
                          rpgtSellerType === type.id 
                            ? 'bg-slate-900 text-white border-slate-900 shadow-xs' 
                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {type.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Insurance & Protective Controllers */}
            {activeTab === 'insurance' && (
              <div className="space-y-5">
                {/* Sum Insured */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <label className="font-bold text-slate-700">{language.startsWith('zh') ? '建筑物重建核保额 (Sum Insured)' : 'Property Rebuilding Sum Insured'}</label>
                    <span className="font-black text-slate-800 bg-slate-50 px-2.5 py-1 rounded-md">{formatPrice(fireSumInsured)}</span>
                  </div>
                  <input 
                    type="range" 
                    min={100000} 
                    max={1500000} 
                    step={10000} 
                    value={fireSumInsured} 
                    onChange={(e) => setFireSumInsured(Number(e.target.value))}
                    className="w-full accent-orange-500 h-1.5 bg-slate-100 rounded-lg cursor-pointer"
                  />
                  <span className="block text-[10px] text-slate-400 font-bold leading-none mt-1">
                    * {language.startsWith('zh') ? '注意：保额应代表房屋的重建成本，而非其市场售价。' : 'Note: This should cover rebuilding cost, not the property market value.'}
                  </span>
                </div>

                {/* Age */}
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <div className="flex justify-between items-center text-xs">
                    <label className="font-bold text-slate-700">{language.startsWith('zh') ? '借款人年龄' : 'Borrower Current Age'}</label>
                    <span className="font-black text-slate-800 bg-slate-50 px-2.5 py-1 rounded-md">{borrowerAge} {language.startsWith('zh') ? '岁' : 'years old'}</span>
                  </div>
                  <input 
                    type="range" 
                    min={18} 
                    max={65} 
                    step={1} 
                    value={borrowerAge} 
                    onChange={(e) => setBorrowerAge(Number(e.target.value))}
                    className="w-full accent-orange-500 h-1.5 bg-slate-100 rounded-lg cursor-pointer"
                  />
                </div>
              </div>
            )}

          </div>

          {/* RIGHT COLUMN: ACTIVE FINANCIAL ENGINE TERMINAL */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* 1. FINANCING MODULE PANEL */}
            {activeTab === 'financing' && (
              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6">
                {/* Sub tabs */}
                <div className="flex flex-wrap gap-1.5 border-b border-slate-100 pb-4">
                  {[
                    { id: 'loan', label: language.startsWith('zh') ? '月供计算' : 'Monthly Mortgage' },
                    { id: 'amortization', label: language.startsWith('zh') ? '本息还款表' : 'Amortization Table' },
                    { id: 'interest_savings', label: language.startsWith('zh') ? '加付省息' : 'Interest Savings' },
                    { id: 'flexi', label: language.startsWith('zh') ? '全/半往来对冲' : 'Full vs Semi-Flexi' },
                    { id: 'refinance', label: language.startsWith('zh') ? '转贷/再融资' : 'Refinance Optimizer' },
                    { id: 'early_settlement', label: language.startsWith('zh') ? '提前结清' : 'Early Settlement' }
                  ].map((sub) => (
                    <button
                      key={sub.id}
                      onClick={() => setFinancingSubTab(sub.id as any)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                        financingSubTab === sub.id 
                          ? 'bg-orange-500 text-white shadow-xs' 
                          : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {sub.label}
                    </button>
                  ))}
                </div>

                {/* Sub Tab Contents */}
                {financingSubTab === 'loan' && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="p-4 bg-slate-50/50 rounded-xl border border-slate-100 text-center">
                        <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">{language.startsWith('zh') ? '净贷款额' : 'Total Loan Amount'}</span>
                        <span className="text-xl font-black text-slate-900 block mt-1">{formatPrice(mortgageResults.loanAmount)}</span>
                      </div>
                      <div className="p-4 bg-orange-500 text-white rounded-xl text-center shadow-md">
                        <span className="block text-[10px] font-bold text-orange-200 uppercase tracking-widest">{language.startsWith('zh') ? '每月供款 (EMI)' : 'Monthly Installment'}</span>
                        <span className="text-2xl font-black block mt-1">{formatPrice(mortgageResults.monthlyInstallment)}</span>
                      </div>
                      <div className="p-4 bg-slate-50/50 rounded-xl border border-slate-100 text-center">
                        <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">{language.startsWith('zh') ? '累计支付利息' : 'Total Interest Payable'}</span>
                        <span className="text-xl font-black text-amber-600 block mt-1">{formatPrice(mortgageResults.totalInterest)}</span>
                      </div>
                    </div>

                    {/* Compact Visual Ratio Bar Chart */}
                    <div className="space-y-2">
                      <span className="block text-xs font-bold text-slate-500 text-left">{language.startsWith('zh') ? '还款本息构成占比 (还款总额)' : 'Mortgage Payment Breakdown Ratio'}</span>
                      <div className="h-6 w-full rounded-full overflow-hidden flex font-black text-[10px] text-white">
                        <div 
                          style={{ width: `${(mortgageResults.loanAmount / mortgageResults.totalPayment) * 100}%` }}
                          className="bg-slate-900 flex items-center justify-center truncate px-2"
                        >
                          {language.startsWith('zh') ? '本金' : 'Principal'} ({(mortgageResults.loanAmount / mortgageResults.totalPayment * 100).toFixed(0)}%)
                        </div>
                        <div 
                          style={{ width: `${(mortgageResults.totalInterest / mortgageResults.totalPayment) * 100}%` }}
                          className="bg-amber-500 flex items-center justify-center truncate px-2"
                        >
                          {language.startsWith('zh') ? '利息' : 'Interest'} ({(mortgageResults.totalInterest / mortgageResults.totalPayment * 100).toFixed(0)}%)
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {financingSubTab === 'amortization' && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                      <span className="text-xs font-bold text-slate-500">{language.startsWith('zh') ? '年终余额与本息年账单' : 'Year-by-Year Amortization Schedule'}</span>
                      <button 
                        onClick={() => setShowAmortizationAll(!showAmortizationAll)}
                        className="text-[11px] font-black text-orange-500 hover:underline cursor-pointer"
                      >
                        {showAmortizationAll 
                          ? (language.startsWith('zh') ? '收起折叠' : 'Show Compact (First 5 Years)') 
                          : (language.startsWith('zh') ? '展开全部 (30年)' : 'View Full Tenure')}
                      </button>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-xs text-left text-slate-600">
                        <thead className="bg-slate-50 text-slate-700 uppercase font-black text-[10px]">
                          <tr>
                            <th className="py-2.5 px-3">{language.startsWith('zh') ? '年份' : 'Year'}</th>
                            <th className="py-2.5 px-3 text-right">{language.startsWith('zh') ? '年初本金' : 'Starting Bal'}</th>
                            <th className="py-2.5 px-3 text-right text-rose-600">{language.startsWith('zh') ? '支付利息' : 'Interest Paid'}</th>
                            <th className="py-2.5 px-3 text-right text-emerald-600">{language.startsWith('zh') ? '还款本金' : 'Principal Paid'}</th>
                            <th className="py-2.5 px-3 text-right">{language.startsWith('zh') ? '年终余额' : 'Ending Bal'}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {amortizationSchedule.slice(0, showAmortizationAll ? undefined : 5).map((row) => (
                            <tr key={row.year} className="hover:bg-slate-50/50">
                              <td className="py-2 px-3 font-bold text-slate-900">{row.year}</td>
                              <td className="py-2 px-3 text-right">{formatPrice(row.startingBalance)}</td>
                              <td className="py-2 px-3 text-right text-rose-500 font-medium">{formatPrice(row.interestPaid)}</td>
                              <td className="py-2 px-3 text-right text-emerald-500 font-medium">{formatPrice(row.principalPaid)}</td>
                              <td className="py-2 px-3 text-right font-semibold text-slate-800">{formatPrice(row.endingBalance)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {financingSubTab === 'interest_savings' && (
                  <div className="space-y-6 text-left">
                    <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <span className="block text-xs font-bold text-emerald-800">{language.startsWith('zh') ? '提前结清节省的利息' : 'Total Lifetime Interest Saved'}</span>
                        <span className="text-3xl font-black text-emerald-700 block mt-1">{formatPrice(savingsResults.interestSaved)}</span>
                      </div>
                      <div>
                        <span className="block text-xs font-bold text-emerald-800">{language.startsWith('zh') ? '贷款期缩短年限' : 'Months & Years Saved'}</span>
                        <span className="text-2xl font-black text-emerald-700 block mt-1">
                          {savingsResults.monthsSaved} {language.startsWith('zh') ? '个月' : 'months'} ({savingsResults.yearsSaved} {language.startsWith('zh') ? '年' : 'years'})
                        </span>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex justify-between items-center text-xs">
                        <label className="font-bold text-slate-700">{language.startsWith('zh') ? '每月自发额外偿还的本金金额' : 'Additional Monthly Principal Payment'}</label>
                        <span className="font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">+{formatPrice(extraMonthlyPayment)}</span>
                      </div>
                      <input 
                        type="range" 
                        min={50} 
                        max={3000} 
                        step={50} 
                        value={extraMonthlyPayment} 
                        onChange={(e) => setExtraMonthlyPayment(Number(e.target.value))}
                        className="w-full accent-emerald-500 h-1.5 bg-slate-100 rounded-lg cursor-pointer"
                      />
                      <p className="text-[11px] text-slate-400 font-bold leading-relaxed">
                        {language.startsWith('zh') 
                          ? '提示：在马来西亚，只要将额外的款项存入您的半链接/全链接（Semi/Full-Flexi）房贷中，利息就会按日按递减本金自动对冲，大幅减少您的还款利息支出。'
                          : 'Pro Tip: Depositing extra funds monthly into your Semi or Full-Flexi account in Malaysia automatically offsets principal on a daily basis, shaving years off your tenure.'}
                      </p>
                    </div>
                  </div>
                )}

                {financingSubTab === 'flexi' && (
                  <div className="space-y-5 text-left">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                        <span className="block text-[10px] font-black text-slate-400 uppercase tracking-wider">{language.startsWith('zh') ? '半往来房贷 (Semi-Flexi)' : 'Semi-Flexi Total Interest'}</span>
                        <span className="text-lg font-bold text-slate-800 block mt-1">{formatPrice(flexiComparison.totalInterestSemi)}</span>
                        <span className="block text-[10px] text-slate-400 mt-1">{language.startsWith('zh') ? '没有日常储蓄对冲机制' : 'No automatic liquid offset'}</span>
                      </div>
                      <div className={`p-4 rounded-xl border ${flexiComparison.isAdvised ? 'bg-orange-50 border-orange-100' : 'bg-slate-50 border-slate-200'}`}>
                        <span className="block text-[10px] font-black text-slate-500 uppercase tracking-wider">{language.startsWith('zh') ? '全往来房贷对冲 (Full-Flexi)' : 'Full-Flexi Total Interest'}</span>
                        <span className="text-lg font-bold text-slate-900 block mt-1">{formatPrice(flexiComparison.totalInterestFull)}</span>
                        <span className="block text-[10px] text-orange-600 font-bold mt-1">
                          {language.startsWith('zh') 
                            ? `对冲收益省下 ${formatPrice(flexiComparison.netSavings)}` 
                            : `Net savings of ${formatPrice(flexiComparison.netSavings)}`}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-4 pt-2 border-t border-slate-100">
                      <div className="flex justify-between items-center text-xs">
                        <label className="font-bold text-slate-700">{language.startsWith('zh') ? '全往来账户日常留存的富余资金余额 (对冲池)' : 'Average Balance Parked in Flexi Current Account'}</label>
                        <span className="font-black text-slate-800 bg-slate-50 px-2 py-0.5 rounded-md">{formatPrice(flexiSavingsBalance)}</span>
                      </div>
                      <input 
                        type="range" 
                        min={0} 
                        max={300000} 
                        step={5000} 
                        value={flexiSavingsBalance} 
                        onChange={(e) => setFlexiSavingsBalance(Number(e.target.value))}
                        className="w-full accent-orange-500 h-1.5 bg-slate-100 rounded-lg cursor-pointer"
                      />
                    </div>
                  </div>
                )}

                {financingSubTab === 'refinance' && (
                  <div className="space-y-5 text-left">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="p-3 bg-rose-50 rounded-xl border border-rose-100 text-center">
                        <span className="block text-[9px] font-black text-rose-500 uppercase">{language.startsWith('zh') ? '原月供金额' : 'Old Monthly Payment'}</span>
                        <span className="text-base font-black text-slate-800 block mt-1">{formatPrice(refinanceResults.currentMonthlyInstallment)}</span>
                      </div>
                      <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 text-center">
                        <span className="block text-[9px] font-black text-emerald-600 uppercase">{language.startsWith('zh') ? '转贷后新月供' : 'New Monthly Payment'}</span>
                        <span className="text-base font-black text-slate-800 block mt-1">{formatPrice(refinanceResults.newMonthlyInstallment)}</span>
                      </div>
                      <div className="p-3 bg-orange-500 text-white rounded-xl text-center shadow-xs">
                        <span className="block text-[9px] font-black text-orange-200 uppercase">{language.startsWith('zh') ? '每月节省' : 'Monthly Cash Saved'}</span>
                        <span className="text-lg font-black block mt-0.5">+{formatPrice(refinanceResults.monthlySavings)}</span>
                      </div>
                    </div>

                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      <div>
                        <span className="block text-slate-400 font-bold">{language.startsWith('zh') ? '净利息节省总额 (扣除转贷成本)' : 'Net Lifetime Interest Saved'}</span>
                        <span className="text-lg font-extrabold text-slate-800 mt-1 block">{formatPrice(refinanceResults.netLifetimeSavings)}</span>
                      </div>
                      <div>
                        <span className="block text-slate-400 font-bold">{language.startsWith('zh') ? '转贷成本收回平衡周期' : 'Break-Even Period'}</span>
                        <span className="text-lg font-extrabold text-slate-800 mt-1 block">{refinanceResults.breakEvenMonths} {language.startsWith('zh') ? '个月' : 'Months'}</span>
                      </div>
                    </div>

                    {/* Compact sliders for quick refi modeling */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-500">{language.startsWith('zh') ? '现有按揭未还余额' : 'Current Loan Balance'}</label>
                        <input 
                          type="number" 
                          value={refiCurrentBalance} 
                          onChange={(e) => setRefiCurrentBalance(Number(e.target.value))}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-black"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-500">{language.startsWith('zh') ? '新银行提供的转贷利率' : 'New Bank Rate Offered %'}</label>
                        <input 
                          type="number" 
                          step={0.05}
                          value={refiNewRate} 
                          onChange={(e) => setRefiNewRate(Number(e.target.value))}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-black"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {financingSubTab === 'early_settlement' && (
                  <div className="space-y-5 text-left">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="p-3 bg-rose-50 rounded-xl border border-rose-100 text-center">
                        <span className="block text-[9px] font-black text-rose-500 uppercase">{language.startsWith('zh') ? '提前还清违约罚息' : 'Lock-In Penalty Fee'}</span>
                        <span className="text-base font-black text-rose-600 block mt-1">{formatPrice(earlySettlementResults.penaltyPaid)}</span>
                      </div>
                      <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 text-center">
                        <span className="block text-[9px] font-black text-emerald-600 uppercase">{language.startsWith('zh') ? '省下的未偿还利息' : 'Future Interest Saved'}</span>
                        <span className="text-base font-black text-emerald-600 block mt-1">{formatPrice(earlySettlementResults.interestToBeSaved)}</span>
                      </div>
                      <div className="p-3 bg-slate-900 text-white rounded-xl text-center">
                        <span className="block text-[9px] font-black text-slate-400 uppercase">{language.startsWith('zh') ? '净经济效益' : 'Net Financial Benefit'}</span>
                        <span className="text-base font-black block mt-1">{formatPrice(earlySettlementResults.netSavings)}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-500">{language.startsWith('zh') ? '已还贷年限' : 'Years Already Repaid'}</label>
                        <input 
                          type="number" 
                          value={earlyYearsStarted} 
                          onChange={(e) => setEarlyYearsStarted(Number(e.target.value))}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-black"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-500">{language.startsWith('zh') ? '银行锁定锁定期 (年)' : 'Lock-in Period (Years)'}</label>
                        <input 
                          type="number" 
                          value={earlyLockInPeriod} 
                          onChange={(e) => setEarlyLockInPeriod(Number(e.target.value))}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-black"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 2. DEBT & AFFORDABILITY MODULE PANEL */}
            {activeTab === 'affordability' && (
              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6">
                <div className="flex border-b border-slate-100 pb-4 gap-2">
                  <button 
                    onClick={() => setAffordabilitySubTab('dsr')}
                    className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${affordabilitySubTab === 'dsr' ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-600'}`}
                  >
                    {language.startsWith('zh') ? '个人偿债能力评测 (DSR)' : 'Debt Service Ratio (DSR)'}
                  </button>
                  <button 
                    onClick={() => setAffordabilitySubTab('affordability')}
                    className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${affordabilitySubTab === 'affordability' ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-600'}`}
                  >
                    {language.startsWith('zh') ? '最高购房额度推算' : 'Maximum Property Budget'}
                  </button>
                </div>

                {affordabilitySubTab === 'dsr' && (
                  <div className="space-y-6 text-left">
                    {/* Gauge Meter Verdict Card */}
                    <div className={`p-5 rounded-2xl border ${dsrResults.bgVerdictColor} grid grid-cols-1 md:grid-cols-2 gap-4 items-center`}>
                      <div>
                        <span className="block text-[10px] font-black text-slate-400 uppercase tracking-wider">{language.startsWith('zh') ? '您的当前总负债比率' : 'Your Computed DSR'}</span>
                        <span className="text-3xl font-black block text-slate-900 mt-1">{dsrResults.currentDsr.toFixed(1)}%</span>
                        <span className="text-xs text-slate-500 block mt-1">
                          {language.startsWith('zh') ? '总计月债务支出: ' : 'Total monthly obligations: '} 
                          <span className="font-bold text-slate-700">{formatPrice(dsrResults.totalCommitments)}</span>
                        </span>
                      </div>
                      <div className="md:border-l md:border-slate-200/50 md:pl-6">
                        <span className="block text-[10px] font-black text-slate-400 uppercase tracking-wider">{language.startsWith('zh') ? '银行按揭审批判定' : 'Bank Approval Verdict'}</span>
                        <span className={`text-xl font-black block mt-1 ${dsrResults.verdictColor}`}>{dsrResults.verdict}</span>
                        <span className="text-[11px] text-slate-500 block mt-1 leading-normal">
                          {language.startsWith('zh') 
                            ? `结合您的净收入 ${formatPrice(dsrResults.netIncome)} 评测。建议控制负债率在 ${dsrMaxRatio}% 以内。` 
                            : `Assessed on net monthly income of ${formatPrice(dsrResults.netIncome)}. Ideal DSR limit is below ${dsrMaxRatio}%.`}
                        </span>
                      </div>
                    </div>

                    {/* Progress bar scale */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] text-slate-400 font-bold">
                        <span>Safe (Under 60%)</span>
                        <span>Warning Line ({dsrMaxRatio}%)</span>
                        <span>Over Limit</span>
                      </div>
                      <div className="h-4 w-full bg-slate-100 rounded-full overflow-hidden relative">
                        <div 
                          className="h-full bg-slate-900" 
                          style={{ width: `${Math.min(100, dsrResults.currentDsr)}%` }} 
                        />
                        {/* Threshold pin */}
                        <div 
                          className="absolute top-0 bottom-0 w-0.5 bg-rose-500" 
                          style={{ left: `${dsrMaxRatio}%` }} 
                        />
                      </div>
                    </div>
                  </div>
                )}

                {affordabilitySubTab === 'affordability' && (
                  <div className="space-y-6 text-left">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 bg-orange-50 rounded-xl border border-orange-100">
                        <span className="block text-xs font-bold text-slate-500">{language.startsWith('zh') ? '预计最高可承受购房价格' : 'Max Property Purchase Price'}</span>
                        <span className="text-2xl font-black ig-text block mt-1">{formatPrice(loanAffordabilityResults.estimatedPropertyPrice)}</span>
                      </div>
                      <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                        <span className="block text-xs font-bold text-slate-500">{language.startsWith('zh') ? '预计最大批贷额度' : 'Max Allowed Loan Principal'}</span>
                        <span className="text-2xl font-black text-slate-800 block mt-1">{formatPrice(loanAffordabilityResults.maxLoanAmount)}</span>
                      </div>
                    </div>

                    <div className="p-4 bg-slate-50/50 rounded-xl border border-slate-100 flex gap-3">
                      <Info className="h-5 w-5 text-orange-500 shrink-0" />
                      <p className="text-xs text-slate-500 leading-relaxed">
                        {language.startsWith('zh') 
                          ? `计算依据：扣除已有贷款月供后，您每月可支配最大房贷还款额为 ${formatPrice(loanAffordabilityResults.maxNewInstallment)} (符合 DSR 指标)。` 
                          : `Calculated based on your leftover monthly housing payment capacity of ${formatPrice(loanAffordabilityResults.maxNewInstallment)} after servicing existing debts.`}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 3. TRANSACTION COST MODULE PANEL */}
            {activeTab === 'transaction' && (
              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6">
                <div className="flex flex-wrap border-b border-slate-100 pb-4 gap-1.5">
                  {[
                    { id: 'stamp_duty', label: language.startsWith('zh') ? '印花税与律师费' : 'Stamp Duties & Legal Fees' },
                    { id: 'buying_cost', label: language.startsWith('zh') ? '前期全套置业成本' : 'Upfront Purchase Cost' },
                    { id: 'renovation', label: language.startsWith('zh') ? '装修工期预算' : 'Renovation Estimator' },
                    { id: 'rent_vs_buy', label: language.startsWith('zh') ? '租房 vs 买房决策' : 'Rent vs Buy Modeling' }
                  ].map((sub) => (
                    <button
                      key={sub.id}
                      onClick={() => setTransactionSubTab(sub.id as any)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                        transactionSubTab === sub.id ? 'bg-orange-500 text-white shadow-xs' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {sub.label}
                    </button>
                  ))}
                </div>

                {transactionSubTab === 'stamp_duty' && (
                  <div className="space-y-5 text-left">
                    <div className="p-4 bg-slate-900 text-white rounded-xl">
                      <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">{language.startsWith('zh') ? '交易税费及法务开支总计' : 'Aggregate Statutory Fees & Legal cost'}</span>
                      <span className="text-3xl font-black block mt-1">{formatPrice(transactionFees.totalTransactionFees)}</span>
                    </div>

                    <div className="space-y-3.5 pt-2">
                      <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider">Breakdown of Statutory Fees</h4>
                      
                      {/* SPA MOT */}
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-600 font-bold">{language.startsWith('zh') ? '房屋转让印花税 (MOT Stamp Duty - 阶梯)' : 'MOT Deed Stamp Duty (Tiered Scale)'}</span>
                        <span className="font-black text-slate-800">{formatPrice(transactionFees.stampDutyMot)}</span>
                      </div>

                      {/* SPA Legal */}
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-600 font-bold">{language.startsWith('zh') ? '购房合同律师费 (SPA Legal Fee - 阶梯)' : 'SPA Contract Legal Fee (SRO 2023)'}</span>
                        <span className="font-black text-slate-800">{formatPrice(transactionFees.spaLegalFee)}</span>
                      </div>

                      {/* Loan Stamp */}
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-600 font-bold">{language.startsWith('zh') ? '贷款合同印花税 (Loan Stamp Duty - 0.5%)' : 'Loan Agreement Stamp Duty (0.5%)'}</span>
                        <span className="font-black text-slate-800">{formatPrice(transactionFees.loanStampDuty)}</span>
                      </div>

                      {/* Loan Legal */}
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-600 font-bold">{language.startsWith('zh') ? '贷款合同律师费 (Loan Legal Fee)' : 'Loan Document Legal Fee'}</span>
                        <span className="font-black text-slate-800">{formatPrice(transactionFees.loanLegalFee)}</span>
                      </div>
                    </div>
                  </div>
                )}

                {transactionSubTab === 'buying_cost' && (
                  <div className="space-y-5 text-left">
                    <div className="p-4 bg-orange-500 text-white rounded-xl shadow-xs">
                      <span className="block text-[10px] font-bold text-orange-200 uppercase tracking-widest">{language.startsWith('zh') ? '首付 + 缴税 + 律师费累计首期所需现金' : 'Minimum Upfront Cash Required (Excl. Reno)'}</span>
                      <span className="text-3xl font-black block mt-1">{formatPrice(totalBuyingCostResults.cashRequired)}</span>
                    </div>

                    <div className="space-y-3 pt-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-600 font-bold">{language.startsWith('zh') ? '房产购买首付款 (Downpayment)' : 'Property Downpayment'}</span>
                        <span className="font-black text-slate-800">{formatPrice(totalBuyingCostResults.downpayment)}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-600 font-bold">{language.startsWith('zh') ? '法务与税务印花税小计' : 'Legal & Stamp Duties Subtotal'}</span>
                        <span className="font-black text-slate-800">{formatPrice(transactionFees.totalTransactionFees)}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-600 font-bold">{language.startsWith('zh') ? '杂支估算 (合同注册及档案杂费)' : 'Disbursements (SPA + Loan registration)'}</span>
                        <span className="font-black text-slate-800">{formatPrice(disbursementsSpa + disbursementsLoan)}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-600 font-bold">{language.startsWith('zh') ? '银行估值报告评估费 (Valuation Fee ~0.25%)' : 'Bank Valuation Appraisal Fee (~0.25%)'}</span>
                        <span className="font-black text-slate-800">{formatPrice(totalBuyingCostResults.valuationFee)}</span>
                      </div>
                    </div>
                  </div>
                )}

                {transactionSubTab === 'renovation' && (
                  <div className="space-y-6 text-left">
                    <div className="p-4 bg-slate-900 text-white rounded-xl">
                      <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">{language.startsWith('zh') ? '预计装修总开销' : 'Total Renovation Budget'}</span>
                      <span className="text-2xl font-black block mt-1">{formatPrice(totalRenovationCost)}</span>
                    </div>

                    <div className="space-y-3.5">
                      <span className="text-xs font-black text-slate-400 uppercase tracking-widest block">Itemized Budget Settings</span>
                      
                      {[
                        { label: language.startsWith('zh') ? '客厅与硬装 (Living Room & Ceilings)' : 'Living Room', val: renoLiving, set: setRenoLiving, max: 80000 },
                        { label: language.startsWith('zh') ? '厨房与定制橱柜 (Kitchen & Carpentry)' : 'Kitchen & Cabinets', val: renoKitchen, set: setRenoKitchen, max: 80000 },
                        { label: language.startsWith('zh') ? '卧室硬装家具 (Bedrooms Design)' : 'Bedrooms Wardrobes', val: renoBedrooms, set: setRenoBedrooms, max: 50000 },
                        { label: language.startsWith('zh') ? '卫浴干湿分离 (Bathrooms Refurbish)' : 'Bathrooms Plumbings', val: renoBathrooms, set: setRenoBathrooms, max: 30000 },
                        { label: language.startsWith('zh') ? '全屋大金/松下空调 (Air Conditioners)' : 'Air Conditioning Units', val: renoAC, set: setRenoAC, max: 20000 },
                        { label: language.startsWith('zh') ? '刷漆与全屋布线 (Piping & Painting)' : 'Piping, Wiring & Painting', val: renoPipingPainting, set: setRenoPipingPainting, max: 25000 }
                      ].map((item, index) => (
                        <div key={index} className="space-y-1">
                          <div className="flex justify-between items-center text-[11px] text-slate-600 font-bold">
                            <span>{item.label}</span>
                            <span className="text-slate-800 font-black">{formatPrice(item.val)}</span>
                          </div>
                          <input 
                            type="range" 
                            min={0} 
                            max={item.max} 
                            step={1000} 
                            value={item.val} 
                            onChange={(e) => item.set(Number(e.target.value))}
                            className="w-full accent-slate-800 h-1 bg-slate-100 rounded-lg cursor-pointer"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {transactionSubTab === 'rent_vs_buy' && (
                  <div className="space-y-5 text-left">
                    <div className={`p-4 rounded-xl border ${rentVsBuyResults.buyerWins ? 'bg-emerald-50 border-emerald-100' : 'bg-orange-50 border-orange-100'} text-xs leading-relaxed`}>
                      <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">{language.startsWith('zh') ? '10年周期最佳财务效益判定' : 'Rent vs Buy Modeling Result'}</span>
                      <span className="text-xl font-black block mt-1 text-slate-900">
                        {rentVsBuyResults.buyerWins 
                          ? (language.startsWith('zh') ? '建议买房：买房积累的资产净值更优' : 'Buying is more financially advantageous!') 
                          : (language.startsWith('zh') ? '建议租房：投资其他优质资产回报更佳' : 'Renting is more financially advantageous!')}
                      </span>
                      <span className="block text-[11px] text-slate-500 mt-1">
                        {language.startsWith('zh') 
                          ? `优势相差金额约达: ${formatPrice(rentVsBuyResults.netAdvantage)}` 
                          : `Net portfolio difference of approximately ${formatPrice(rentVsBuyResults.netAdvantage)}.`}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                        <span className="font-bold text-slate-500 block">{language.startsWith('zh') ? '10年后买房积累净值' : 'If You Buy (Accumulated Net Equity)'}</span>
                        <span className="text-base font-black text-slate-800 mt-1 block">{formatPrice(rentVsBuyResults.buyingNetWorth)}</span>
                        <span className="block text-[10px] text-slate-400 mt-1 leading-normal">
                          {language.startsWith('zh') 
                            ? `房屋未来估值 ${formatPrice(propertyPrice * Math.pow(1 + rvbAppreciation / 100, rvbPeriodYears))} 扣除未还贷款和卖房佣金。`
                            : `Asset appreciation based on ${rvbAppreciation}% compounding growth.`}
                        </span>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                        <span className="font-bold text-slate-500 block">{language.startsWith('zh') ? '10年后租房投资累计净值' : 'If You Rent (Alternative Asset Value)'}</span>
                        <span className="text-base font-black text-slate-800 mt-1 block">{formatPrice(rentVsBuyResults.rentingInvestValue)}</span>
                        <span className="block text-[10px] text-slate-400 mt-1 leading-normal">
                          {language.startsWith('zh') 
                            ? `将首付及前期开销和差额，投入年利率为 ${rvbAltReturn}% 的高派息理财。累计支付租金为 ${formatPrice(rentVsBuyResults.totalRentPaid)}。`
                            : `Assuming downpayment capital is parked in a portfolio earning ${rvbAltReturn}%.`}
                        </span>
                      </div>
                    </div>

                    {/* Rent Inputs */}
                    <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-500">{language.startsWith('zh') ? '可比房屋月租金' : 'Comparative Monthly Rent'}</label>
                        <input 
                          type="number" 
                          value={rvbMonthlyRent} 
                          onChange={(e) => setRvbMonthlyRent(Number(e.target.value))}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-black text-right"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-500">{language.startsWith('zh') ? '预计房屋年涨幅 %' : 'Expected Property Appreciation %'}</label>
                        <input 
                          type="number" 
                          step={0.1}
                          value={rvbAppreciation} 
                          onChange={(e) => setRvbAppreciation(Number(e.target.value))}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-black text-right"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 4. YIELDS MODULE PANEL */}
            {activeTab === 'yields' && (
              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6">
                <div className="flex border-b border-slate-100 pb-4 gap-2">
                  <button 
                    onClick={() => setYieldsSubTab('rental')}
                    className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${yieldsSubTab === 'rental' ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-600'}`}
                  >
                    {language.startsWith('zh') ? '长租常规租金收益率' : 'Standard Rental Yield'}
                  </button>
                  <button 
                    onClick={() => setYieldsSubTab('airbnb')}
                    className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${yieldsSubTab === 'airbnb' ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-600'}`}
                  >
                    {language.startsWith('zh') ? 'Airbnb 民宿收益率' : 'Airbnb Short-Term Yield'}
                  </button>
                  <button 
                    onClick={() => setYieldsSubTab('risk')}
                    className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${yieldsSubTab === 'risk' ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-600'}`}
                  >
                    {language.startsWith('zh') ? '投资杠杆风险现金流' : 'Leverage Risk & Cashflow'}
                  </button>
                </div>

                {yieldsSubTab === 'rental' && (
                  <div className="space-y-5 text-left">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                        <span className="block text-xs font-bold text-slate-500">{language.startsWith('zh') ? '毛租金收益率 (Gross Yield)' : 'Gross Rental Yield'}</span>
                        <span className="text-3xl font-black text-slate-900 block mt-1">{rentalYieldResults.grossYield.toFixed(2)}%</span>
                        <span className="block text-[11px] text-slate-400 mt-1">
                          {language.startsWith('zh') ? '年租金总收入: ' : 'Annual gross rent: '}
                          <span className="font-bold text-slate-700">{formatPrice(rentalYieldResults.grossRevenue)}</span>
                        </span>
                      </div>
                      <div className="p-4 bg-orange-50 rounded-xl border border-orange-100">
                        <span className="block text-xs font-bold text-orange-800">{language.startsWith('zh') ? '净租金收益率 (Net Yield)' : 'Net Rental Yield'}</span>
                        <span className="text-3xl font-black text-orange-600 block mt-1">{rentalYieldResults.netYield.toFixed(2)}%</span>
                        <span className="block text-[11px] text-slate-400 mt-1">
                          {language.startsWith('zh') ? '扣除成本后年租金: ' : 'Annual net rent: '}
                          <span className="font-bold text-slate-700">{formatPrice(rentalYieldResults.netRevenue)}</span>
                        </span>
                      </div>
                    </div>

                    {/* Long term Rent Sliders */}
                    <div className="space-y-4 pt-2 border-t border-slate-100">
                      <div className="flex justify-between items-center text-xs">
                        <label className="font-bold text-slate-700">{language.startsWith('zh') ? '预计长租月租金' : 'Expected Monthly Rent'}</label>
                        <span className="font-black text-slate-800 bg-slate-50 px-2 py-0.5 rounded-md">{formatPrice(expectedRent)}</span>
                      </div>
                      <input 
                        type="range" 
                        min={1000} 
                        max={12000} 
                        step={100} 
                        value={expectedRent} 
                        onChange={(e) => setExpectedRent(Number(e.target.value))}
                        className="w-full accent-orange-500 h-1.5 bg-slate-100 rounded-lg cursor-pointer"
                      />
                    </div>
                  </div>
                )}

                {yieldsSubTab === 'airbnb' && (
                  <div className="space-y-5 text-left">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                        <span className="block text-xs font-bold text-slate-500">{language.startsWith('zh') ? '预计年均入住夜数' : 'Annual Occupancy Nights'}</span>
                        <span className="text-2xl font-black text-slate-900 block mt-1">{airbnbYieldResults.activeNightsPerYear} {language.startsWith('zh') ? '晚' : 'Nights'} ({airbnbOccupancy}%)</span>
                        <span className="block text-[11px] text-slate-400 mt-1">
                          {language.startsWith('zh') ? '总流水收益: ' : 'Gross revenues: '}
                          <span className="font-bold text-slate-700">{formatPrice(airbnbYieldResults.annualGrossAirbnbRevenue)}</span>
                        </span>
                      </div>
                      <div className="p-4 bg-orange-50 rounded-xl border border-orange-100">
                        <span className="block text-xs font-bold text-orange-800">{language.startsWith('zh') ? 'Airbnb 净租金收益率' : 'Airbnb Net Yield'}</span>
                        <span className="text-2xl font-black text-orange-600 block mt-1">{airbnbYieldResults.netAirbnbYield.toFixed(2)}%</span>
                        <span className="block text-[11px] text-slate-400 mt-1">
                          {language.startsWith('zh') ? '扣除维护/布草/管理后年收入: ' : 'Net Annual short-term income: '}
                          <span className="font-bold text-slate-700">{formatPrice(airbnbYieldResults.netAirbnbIncome)}</span>
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-500">{language.startsWith('zh') ? 'Airbnb 平均日间房价' : 'Average Nightly Rate'}</label>
                        <input 
                          type="number" 
                          value={airbnbDailyRate} 
                          onChange={(e) => setAirbnbDailyRate(Number(e.target.value))}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-black text-right"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-500">{language.startsWith('zh') ? '平均入住率 %' : 'Average Occupancy %'}</label>
                        <input 
                          type="number" 
                          value={airbnbOccupancy} 
                          onChange={(e) => setAirbnbOccupancy(Number(e.target.value))}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-black text-right"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {yieldsSubTab === 'risk' && (
                  <div className="space-y-5 text-left">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className={`p-3 rounded-xl border text-center ${riskCashFlowResults.monthlyCashFlow >= 0 ? 'bg-emerald-50 border-emerald-100' : 'bg-rose-50 border-rose-100'}`}>
                        <span className="block text-[9px] font-black text-slate-500 uppercase">{language.startsWith('zh') ? '月均净现金流' : 'Monthly Net Cashflow'}</span>
                        <span className={`text-base font-black block mt-1 ${riskCashFlowResults.monthlyCashFlow >= 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
                          {riskCashFlowResults.monthlyCashFlow >= 0 ? '+' : ''}{formatPrice(riskCashFlowResults.monthlyCashFlow)}
                        </span>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-center">
                        <span className="block text-[9px] font-black text-slate-500 uppercase">{language.startsWith('zh') ? '现金回报率 (CoC)' : 'Cash-on-Cash Return'}</span>
                        <span className="text-base font-black text-slate-800 block mt-1">{riskCashFlowResults.cashOnCashReturn.toFixed(2)}%</span>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-center">
                        <span className="block text-[9px] font-black text-slate-500 uppercase">{language.startsWith('zh') ? '债务偿还覆盖率 (DSCR)' : 'Debt Coverage Ratio'}</span>
                        <span className={`text-base font-black block mt-1 ${riskCashFlowResults.dscr >= 1.2 ? 'text-emerald-600' : 'text-rose-500'}`}>{riskCashFlowResults.dscr.toFixed(2)}</span>
                      </div>
                    </div>

                    <div className="p-4 bg-slate-50/50 rounded-xl border border-slate-100 flex gap-3 text-xs leading-relaxed text-slate-500">
                      <ShieldAlert className="h-5 w-5 text-orange-500 shrink-0" />
                      <div>
                        <span className="block font-black text-slate-800 mb-0.5">{language.startsWith('zh') ? '银行对于投资房的风险指标建议' : 'Property Investor DSCR Advice'}</span>
                        {language.startsWith('zh') 
                          ? 'DSCR 大于 1.20 代表您的房屋租金收入可以安全覆盖按揭月供还有余裕（免去倒贴月供的风险）；若 DSCR 小于 1.0，则意味着您每个月需要从个人主收入中拿出现金倒贴支持该房贷。'
                          : 'A DSCR of 1.20 or greater indicates your property operates in a healthy cashflow-positive buffer. Under 1.0 means the landlord must inject personal income to meet bank payments.'}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 5. TAX & GAINS MODULE PANEL */}
            {activeTab === 'profit' && (
              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6">
                <div className="flex border-b border-slate-100 pb-4 gap-2">
                  <button 
                    onClick={() => setProfitSubTab('rpgt')}
                    className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${profitSubTab === 'rpgt' ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-600'}`}
                  >
                    {language.startsWith('zh') ? '产业盈利税 (RPGT)' : 'Real Property Gains Tax (RPGT)'}
                  </button>
                  <button 
                    onClick={() => setProfitSubTab('net_profit')}
                    className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${profitSubTab === 'net_profit' ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-600'}`}
                  >
                    {language.startsWith('zh') ? '综合置业离场净利润' : 'Exit Profit & ROI'}
                  </button>
                </div>

                {profitSubTab === 'rpgt' && (
                  <div className="space-y-5 text-left">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 bg-rose-50 rounded-xl border border-rose-100">
                        <span className="block text-xs font-bold text-rose-800">{language.startsWith('zh') ? '应缴产业盈利税 (RPGT Payable)' : 'Estimated RPGT Payable'}</span>
                        <span className="text-3xl font-black text-rose-600 block mt-1">{formatPrice(rpgtResults.taxPayable)}</span>
                        <span className="block text-[11px] text-slate-400 mt-1">
                          {language.startsWith('zh') ? '适用产业税率: ' : 'RPGT statutory rate: '}
                          <span className="font-bold text-slate-700">{rpgtResults.rate}%</span>
                        </span>
                      </div>
                      <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                        <span className="block text-xs font-bold text-slate-500">{language.startsWith('zh') ? '应税纯资产盈利额 (免税后)' : 'Taxable Net Gains'}</span>
                        <span className="text-2xl font-black text-slate-800 block mt-1">{formatPrice(rpgtResults.netTaxableGain)}</span>
                        <span className="block text-[11px] text-slate-400 mt-1">
                          {language.startsWith('zh') ? '已扣除个人法定起征点豁免: ' : 'Less statutory base allowance: '}
                          <span className="font-bold text-slate-700">{formatPrice(rpgtResults.individualExemption)}</span>
                        </span>
                      </div>
                    </div>

                    <div className="p-4 bg-slate-50/50 rounded-xl border border-slate-100 flex gap-3 text-xs leading-relaxed text-slate-500">
                      <Info className="h-5 w-5 text-slate-400 shrink-0" />
                      <div>
                        {language.startsWith('zh') 
                          ? '产业盈利税（RPGT）是马来西亚政府对出售房产所得的盈利征收的税收。持有年限越长，税率逐步递减，公民或永久居民持有超过 5 年出售，税率为 0%。'
                          : 'RPGT is levied on the net profit made upon selling properties. Citizens enjoy 0% RPGT after 5 years of holding.'}
                      </div>
                    </div>
                  </div>
                )}

                {profitSubTab === 'net_profit' && (
                  <div className="space-y-5 text-left">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 bg-slate-900 text-white rounded-xl">
                        <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">{language.startsWith('zh') ? '离场扣除全部开销后的纯净利润' : 'Net Cash Profit (Exit)'}</span>
                        <span className="text-3xl font-black block mt-1">{formatPrice(netProfitResults.netProfitValue)}</span>
                        <span className="block text-[11px] text-slate-400 mt-1">
                          {language.startsWith('zh') ? '总账面升值毛利: ' : 'Gross asset appreciation: '}
                          <span className="font-bold text-slate-200">{formatPrice(netProfitResults.grossProfit)}</span>
                        </span>
                      </div>
                      <div className="p-4 bg-orange-50 rounded-xl border border-orange-100">
                        <span className="block text-xs font-bold text-orange-800">{language.startsWith('zh') ? '基于首期投入的资本回报率 (ROI)' : 'Return on Cash Invested (ROI)'}</span>
                        <span className="text-3xl font-black text-orange-600 block mt-1">{netProfitResults.roiPercent.toFixed(1)}%</span>
                        <span className="block text-[11px] text-slate-400 mt-1">
                          {language.startsWith('zh') ? '置业和装修利息等总耗用成本: ' : 'Total buy/sell transaction expenses: '}
                          <span className="font-bold text-slate-700">{formatPrice(netProfitResults.totalCosts)}</span>
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 6. INSURANCE MODULE PANEL */}
            {activeTab === 'insurance' && (
              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6">
                <div className="flex border-b border-slate-100 pb-4 gap-2">
                  <button 
                    onClick={() => setInsuranceSubTab('fire')}
                    className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${insuranceSubTab === 'fire' ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-600'}`}
                  >
                    {language.startsWith('zh') ? '房屋火灾基本险保费' : 'Fire Insurance Estimator'}
                  </button>
                  <button 
                    onClick={() => setInsuranceSubTab('mrta_mlta')}
                    className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${insuranceSubTab === 'mrta_mlta' ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-600'}`}
                  >
                    {language.startsWith('zh') ? 'MRTA 递减险 vs MLTA 递增险' : 'MRTA vs MLTA Modeling'}
                  </button>
                </div>

                {insuranceSubTab === 'fire' && (
                  <div className="space-y-5 text-left">
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <span className="block text-xs font-bold text-slate-500">{language.startsWith('zh') ? '预计房屋火灾险年度保费总和' : 'Estimated Annual Fire Premium'}</span>
                        <span className="text-2xl font-black text-slate-900 mt-1 block">{formatPrice(firePremiumResults.totalPremium)} / {language.startsWith('zh') ? '年' : 'year'}</span>
                      </div>
                      <div className="text-xs text-slate-400 leading-normal font-medium space-y-1">
                        <span>{language.startsWith('zh') ? '基础火险年基本保费: ' : 'Base premium: '} <span className="font-bold text-slate-700">{formatPrice(firePremiumResults.annualBasePremium)}</span></span>
                        <br />
                        <span>{language.startsWith('zh') ? '服务税 + 印花税: ' : 'Service tax & Stamps: '} <span className="font-bold text-slate-700">{formatPrice(firePremiumResults.serviceTax + 10)}</span></span>
                      </div>
                    </div>
                  </div>
                )}

                {insuranceSubTab === 'mrta_mlta' && (
                  <div className="space-y-5 text-left text-xs leading-relaxed">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* MRTA */}
                      <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                        <span className="block text-[11px] font-black text-slate-500 uppercase tracking-wider">MRTA (Mortgage Reducing Term)</span>
                        <span className="text-xl font-black text-slate-900 block mt-1">{formatPrice(insuranceCompareResults.mrtaSinglePremiumEst)}</span>
                        <span className="block text-[10px] text-slate-400 font-bold mt-1">
                          {language.startsWith('zh') ? '通常由房贷打包融资分期还款' : 'Single upfront payment, often loan financed.'}
                        </span>
                        
                        <ul className="mt-4 space-y-2 text-slate-500 list-disc list-inside">
                          <li>{language.startsWith('zh') ? '保额随贷款未还余额逐年递减' : 'Sum assured reduces matching loan balance'}</li>
                          <li>{language.startsWith('zh') ? '第一受益人直接归属商业贷款银行' : 'Beneficiary is strictly the lender bank'}</li>
                          <li>{language.startsWith('zh') ? '没有退保现金价值' : 'Zero surrender cash value at end'}</li>
                          <li>{language.startsWith('zh') ? '不可转移到其他房产' : 'Non-transferable to other properties'}</li>
                        </ul>
                      </div>

                      {/* MLTA */}
                      <div className="p-4 bg-orange-50/50 rounded-xl border border-orange-200">
                        <span className="block text-[11px] font-black text-orange-600 uppercase tracking-wider">MLTA (Mortgage Level Term)</span>
                        <span className="text-xl font-black text-slate-900 block mt-1">{formatPrice(mltaMonthlyPremium)} / {language.startsWith('zh') ? '每月' : 'month'}</span>
                        <span className="block text-[10px] text-orange-600 font-bold mt-1">
                          {language.startsWith('zh') ? `30年总现金价值积累: ${formatPrice(insuranceCompareResults.mltaGuaranteedCashValue)}` : `30-yr maturity cash value: ${formatPrice(insuranceCompareResults.mltaGuaranteedCashValue)}`}
                        </span>

                        <ul className="mt-4 space-y-2 text-slate-600 list-disc list-inside">
                          <li>{language.startsWith('zh') ? '保额保持稳定，不随还款降低' : 'Constant level coverage sum throughout'}</li>
                          <li>{language.startsWith('zh') ? '受益人归指定家庭亲属/遗产继承人' : 'Beneficiary is your chosen family heirs'}</li>
                          <li>{language.startsWith('zh') ? '保障加理财，包含返还生存保险金' : 'Accrues cash value you can surrender/withdraw'}</li>
                          <li>{language.startsWith('zh') ? '可灵活转移到新购买的按揭房' : 'Fully transferable if you change properties'}</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

          </div>

        </div>

      </div>
    </div>
  );
}
