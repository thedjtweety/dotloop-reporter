/**
 * Bulk Selection and Export Tests
 * Tests for checkbox selection, Select All, and bulk export functionality
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import TransactionTable from '../TransactionTable';
import BulkActionsToolbar from '../BulkActionsToolbar';
import { DotloopRecord } from '@/lib/csvParser';

describe('Bulk Selection Features', () => {
  const mockTransactions: DotloopRecord[] = [
    {
      loopId: '1',
      loopViewUrl: '',
      loopName: 'Property 1',
      loopStatus: 'Active',
      listingDate: '2025-01-15',
      closingDate: '',
      offerDate: '',
      price: 500000,
      salePrice: 0,
      leadSource: 'Website',
      transactionType: 'Sell',
      agents: 'Agent A',
      buySideCommission: 0,
      sellSideCommission: 7500,
      totalCommission: 7500,
      tags: [],
      createdDate: '2025-01-01',
      address: '123 Main St',
      city: 'Springfield',
      state: 'IL',
      county: '',
      zipCode: '62701',
      yearBuilt: 2000,
      pricePerSqFt: 0,
      daysOnMarket: 14,
      propertyType: 'Single Family',
      notes: '',
      bedrooms: 0,
      bathrooms: 0,
      squareFootage: 0,
      earnestMoney: 0,
      commissionRate: 0,
      commissionTotal: 7500,
      createdBy: '',
      companyDollar: 0,
      referralSource: '',
      referralPercentage: 0,
      complianceStatus: '',
      originalPrice: 500000,
      lotSize: 0,
      subdivision: '',
    } as DotloopRecord,
    {
      loopId: '2',
      loopViewUrl: '',
      loopName: 'Property 2',
      loopStatus: 'Under Contract',
      listingDate: '2025-01-20',
      closingDate: '',
      offerDate: '',
      price: 600000,
      salePrice: 0,
      leadSource: 'Referral',
      transactionType: 'Sell',
      agents: 'Agent B',
      buySideCommission: 0,
      sellSideCommission: 9000,
      totalCommission: 9000,
      tags: [],
      createdDate: '2025-01-05',
      address: '456 Oak Ave',
      city: 'Springfield',
      state: 'IL',
      county: '',
      zipCode: '62701',
      yearBuilt: 1995,
      pricePerSqFt: 0,
      daysOnMarket: 9,
      propertyType: 'Single Family',
      notes: '',
      bedrooms: 0,
      bathrooms: 0,
      squareFootage: 0,
      earnestMoney: 0,
      commissionRate: 0,
      commissionTotal: 9000,
      createdBy: '',
      companyDollar: 0,
      referralSource: '',
      referralPercentage: 0,
      complianceStatus: '',
      originalPrice: 600000,
      lotSize: 0,
      subdivision: '',
    } as DotloopRecord,
    {
      loopId: '3',
      loopViewUrl: '',
      loopName: 'Property 3',
      loopStatus: 'Closed',
      listingDate: '2024-12-01',
      closingDate: '2025-01-10',
      offerDate: '',
      price: 550000,
      salePrice: 550000,
      leadSource: 'MLS',
      transactionType: 'Sell',
      agents: 'Agent C',
      buySideCommission: 0,
      sellSideCommission: 8250,
      totalCommission: 8250,
      tags: [],
      createdDate: '2024-12-01',
      address: '789 Elm St',
      city: 'Springfield',
      state: 'IL',
      county: '',
      zipCode: '62701',
      yearBuilt: 2010,
      pricePerSqFt: 0,
      daysOnMarket: 40,
      propertyType: 'Single Family',
      notes: '',
      bedrooms: 0,
      bathrooms: 0,
      squareFootage: 0,
      earnestMoney: 0,
      commissionRate: 0,
      commissionTotal: 8250,
      createdBy: '',
      companyDollar: 0,
      referralSource: '',
      referralPercentage: 0,
      complianceStatus: '',
      originalPrice: 550000,
      lotSize: 0,
      subdivision: '',
    } as DotloopRecord,
  ];

  describe('TransactionTable Selection', () => {
    it('should render checkbox column when onSelectionChange is provided', () => {
      const mockSelectionChange = vi.fn();
      const { container } = render(
        <TransactionTable
          transactions={mockTransactions}
          selectedRecords={new Set()}
          onSelectionChange={mockSelectionChange}
          selectAll={false}
          onSelectAllChange={vi.fn()}
        />
      );

      // Should have Select All checkbox in header
      const checkboxes = container.querySelectorAll('input[type="checkbox"]');
      expect(checkboxes.length).toBeGreaterThan(0);
    });

    it('should not render checkbox column when onSelectionChange is not provided', () => {
      const { container } = render(
        <TransactionTable transactions={mockTransactions} />
      );

      // Should NOT have any checkboxes
      const checkboxes = container.querySelectorAll('input[type="checkbox"]');
      expect(checkboxes.length).toBe(0);
    });

    it('should call onSelectionChange when individual checkbox is clicked', () => {
      const mockSelectionChange = vi.fn();
      const { container } = render(
        <TransactionTable
          transactions={mockTransactions}
          selectedRecords={new Set()}
          onSelectionChange={mockSelectionChange}
          selectAll={false}
          onSelectAllChange={vi.fn()}
        />
      );

      const checkboxes = container.querySelectorAll('input[type="checkbox"]');
      // First checkbox is "Select All", second is first transaction
      if (checkboxes.length > 1) {
        fireEvent.click(checkboxes[1]);
        expect(mockSelectionChange).toHaveBeenCalled();
      }
    });

    it('should call onSelectAllChange when Select All checkbox is clicked', () => {
      const mockSelectAllChange = vi.fn();
      const mockSelectionChange = vi.fn();
      const { container } = render(
        <TransactionTable
          transactions={mockTransactions}
          selectedRecords={new Set()}
          onSelectionChange={mockSelectionChange}
          selectAll={false}
          onSelectAllChange={mockSelectAllChange}
        />
      );

      const checkboxes = container.querySelectorAll('input[type="checkbox"]');
      // First checkbox is "Select All"
      if (checkboxes.length > 0) {
        fireEvent.click(checkboxes[0]);
        expect(mockSelectAllChange).toHaveBeenCalledWith(true);
        expect(mockSelectionChange).toHaveBeenCalled();
      }
    });

    it('should select all transactions when Select All is checked', () => {
      const mockSelectionChange = vi.fn();
      const { container } = render(
        <TransactionTable
          transactions={mockTransactions}
          selectedRecords={new Set()}
          onSelectionChange={mockSelectionChange}
          selectAll={false}
          onSelectAllChange={vi.fn()}
        />
      );

      const checkboxes = container.querySelectorAll('input[type="checkbox"]');
      if (checkboxes.length > 0) {
        fireEvent.click(checkboxes[0]);
        
        // Should call onSelectionChange with all transaction indices
        const lastCall = mockSelectionChange.mock.calls[mockSelectionChange.mock.calls.length - 1];
        const selectedSet = lastCall[0];
        expect(selectedSet.size).toBeGreaterThan(0);
      }
    });

    it('should deselect all transactions when Select All is unchecked', () => {
      const mockSelectionChange = vi.fn();
      const { container } = render(
        <TransactionTable
          transactions={mockTransactions}
          selectedRecords={new Set([0, 1, 2])}
          onSelectionChange={mockSelectionChange}
          selectAll={true}
          onSelectAllChange={vi.fn()}
        />
      );

      const checkboxes = container.querySelectorAll('input[type="checkbox"]');
      if (checkboxes.length > 0) {
        fireEvent.click(checkboxes[0]);
        
        // Should call onSelectionChange with empty set
        const lastCall = mockSelectionChange.mock.calls[mockSelectionChange.mock.calls.length - 1];
        const selectedSet = lastCall[0];
        expect(selectedSet.size).toBe(0);
      }
    });
  });

  describe('BulkActionsToolbar', () => {
    it('should not render when no transactions are selected', () => {
      const { container } = render(
        <BulkActionsToolbar
          selectedRecords={[]}
          allRecords={mockTransactions}
          title="Test Transactions"
          isVisible={false}
        />
      );

      expect(container.firstChild).toBeNull();
    });

    it('should render when transactions are selected', () => {
      const { container } = render(
        <BulkActionsToolbar
          selectedRecords={[mockTransactions[0]]}
          allRecords={mockTransactions}
          title="Test Transactions"
          isVisible={true}
        />
      );

      expect(container.firstChild).not.toBeNull();
    });

    it('should display correct selection count', () => {
      const { getByText } = render(
        <BulkActionsToolbar
          selectedRecords={[mockTransactions[0], mockTransactions[1]]}
          allRecords={mockTransactions}
          title="Test Transactions"
          isVisible={true}
        />
      );

      // Should show "2 selected"
      expect(getByText(/2 selected/i)).toBeDefined();
    });

    it('should display correct percentage', () => {
      const { getByText } = render(
        <BulkActionsToolbar
          selectedRecords={[mockTransactions[0]]}
          allRecords={mockTransactions}
          title="Test Transactions"
          isVisible={true}
        />
      );

      // 1 out of 3 = 33%
      expect(getByText(/33%/)).toBeDefined();
    });

    it('should render Export CSV button', () => {
      const { getByText } = render(
        <BulkActionsToolbar
          selectedRecords={[mockTransactions[0]]}
          allRecords={mockTransactions}
          title="Test Transactions"
          isVisible={true}
        />
      );

      expect(getByText('CSV')).toBeDefined();
    });

    it('should render Export Excel button', () => {
      const { getByText } = render(
        <BulkActionsToolbar
          selectedRecords={[mockTransactions[0]]}
          allRecords={mockTransactions}
          title="Test Transactions"
          isVisible={true}
        />
      );

      expect(getByText('Excel')).toBeDefined();
    });

    it('should render Open in Dotloop button when transactions are selected', () => {
      const { getByText } = render(
        <BulkActionsToolbar
          selectedRecords={[mockTransactions[0]]}
          allRecords={mockTransactions}
          title="Test Transactions"
          isVisible={true}
        />
      );

      expect(getByText('Dotloop')).toBeDefined();
    });

    it('should render Tag button when onTag callback is provided', () => {
      const mockOnTag = vi.fn();
      const { getByText } = render(
        <BulkActionsToolbar
          selectedRecords={[mockTransactions[0]]}
          allRecords={mockTransactions}
          title="Test Transactions"
          isVisible={true}
          onTag={mockOnTag}
        />
      );

      expect(getByText('Tag')).toBeDefined();
    });

    it('should call onExportCSV when CSV button is clicked', () => {
      const mockOnExportCSV = vi.fn();
      const { getByText } = render(
        <BulkActionsToolbar
          selectedRecords={[mockTransactions[0]]}
          allRecords={mockTransactions}
          title="Test Transactions"
          isVisible={true}
          onExportCSV={mockOnExportCSV}
        />
      );

      const csvButton = getByText('CSV');
      fireEvent.click(csvButton);
      expect(mockOnExportCSV).toHaveBeenCalled();
    });

    it('should call onExportExcel when Excel button is clicked', () => {
      const mockOnExportExcel = vi.fn();
      const { getByText } = render(
        <BulkActionsToolbar
          selectedRecords={[mockTransactions[0]]}
          allRecords={mockTransactions}
          title="Test Transactions"
          isVisible={true}
          onExportExcel={mockOnExportExcel}
        />
      );

      const excelButton = getByText('Excel');
      fireEvent.click(excelButton);
      expect(mockOnExportExcel).toHaveBeenCalled();
    });

    it('should call onOpenDotloop when Dotloop button is clicked', () => {
      const mockOnOpenDotloop = vi.fn();
      const { getByText } = render(
        <BulkActionsToolbar
          selectedRecords={[mockTransactions[0]]}
          allRecords={mockTransactions}
          title="Test Transactions"
          isVisible={true}
          onOpenDotloop={mockOnOpenDotloop}
        />
      );

      const dotloopButton = getByText('Dotloop');
      fireEvent.click(dotloopButton);
      expect(mockOnOpenDotloop).toHaveBeenCalled();
    });

    it('should call onTag when Tag button is clicked', () => {
      const mockOnTag = vi.fn();
      const { getByText } = render(
        <BulkActionsToolbar
          selectedRecords={[mockTransactions[0]]}
          allRecords={mockTransactions}
          title="Test Transactions"
          isVisible={true}
          onTag={mockOnTag}
        />
      );

      const tagButton = getByText('Tag');
      fireEvent.click(tagButton);
      expect(mockOnTag).toHaveBeenCalled();
    });
  });

  describe('Integration Tests', () => {
    it('should enable bulk actions toolbar when transactions are selected', () => {
      const mockSelectionChange = vi.fn();
      const selectedRecords: Set<number> = new Set([0]);
      
      const { container } = render(
        <>
          <TransactionTable
            transactions={mockTransactions}
            selectedRecords={selectedRecords}
            onSelectionChange={mockSelectionChange}
            selectAll={false}
            onSelectAllChange={vi.fn()}
          />
          <BulkActionsToolbar
            selectedRecords={[mockTransactions[0]]}
            allRecords={mockTransactions}
            title="Test Transactions"
            isVisible={selectedRecords.size > 0}
          />
        </>
      );

      // Toolbar should be visible
      expect(container.querySelector('.fixed')).not.toBeNull();
    });

    it('should hide bulk actions toolbar when no transactions are selected', () => {
      const mockSelectionChange = vi.fn();
      const selectedRecords: Set<number> = new Set();
      
      const { container } = render(
        <>
          <TransactionTable
            transactions={mockTransactions}
            selectedRecords={selectedRecords}
            onSelectionChange={mockSelectionChange}
            selectAll={false}
            onSelectAllChange={vi.fn()}
          />
          <BulkActionsToolbar
            selectedRecords={[]}
            allRecords={mockTransactions}
            title="Test Transactions"
            isVisible={selectedRecords.size > 0}
          />
        </>
      );

      // Toolbar should be hidden
      expect(container.querySelector('.fixed')).toBeNull();
    });
  });
});
