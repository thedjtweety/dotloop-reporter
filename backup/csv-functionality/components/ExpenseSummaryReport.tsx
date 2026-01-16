import { useState, useEffect } from 'react';
import { DotloopRecord } from '@/lib/csvParser';
import { calculateCommissionAudit } from '@/lib/commissionCalculator';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

interface ExpenseSummaryReportProps {
  records: DotloopRecord[];
}

interface ExpenseCategory {
  name: string;
  total: number;
  count: number;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

export default function ExpenseSummaryReport({ records }: ExpenseSummaryReportProps) {
  const [expenseCategories, setExpenseCategories] = useState<ExpenseCategory[]>([]);
  const [totalCollected, setTotalCollected] = useState(0);

  useEffect(() => {
    if (records.length > 0) {
      const { auditResults } = calculateCommissionAudit(records);
      
      const categoryMap = new Map<string, { total: number, count: number }>();
      let grandTotal = 0;

      auditResults.forEach(res => {
        if (res.snapshot && res.snapshot.deductionsBreakdown) {
          res.snapshot.deductionsBreakdown.forEach(d => {
            const current = categoryMap.get(d.name) || { total: 0, count: 0 };
            categoryMap.set(d.name, {
              total: current.total + d.amount,
              count: current.count + 1
            });
            grandTotal += d.amount;
          });
        }
      });

      const categories: ExpenseCategory[] = Array.from(categoryMap.entries()).map(([name, data]) => ({
        name,
        total: data.total,
        count: data.count
      })).sort((a, b) => b.total - a.total);

      setExpenseCategories(categories);
      setTotalCollected(grandTotal);
    }
  }, [records]);

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Total Fees Collected</CardTitle>
            <CardDescription>All deductions across transactions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-emerald-600">
              {formatCurrency(totalCollected)}
            </div>
            <p className="text-sm text-foreground mt-2">
              From {expenseCategories.reduce((acc, curr) => acc + curr.count, 0)} total deductions
            </p>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Fee Distribution</CardTitle>
            <CardDescription>Breakdown by expense category</CardDescription>
          </CardHeader>
          <CardContent className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={expenseCategories}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="total"
                >
                  {expenseCategories.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Detailed Expense Report</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Expense Category</TableHead>
                <TableHead className="text-right">Transaction Count</TableHead>
                <TableHead className="text-right">Total Amount</TableHead>
                <TableHead className="text-right">% of Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {expenseCategories.map((cat, idx) => (
                <TableRow key={idx}>
                  <TableCell className="font-medium">{cat.name}</TableCell>
                  <TableCell className="text-right">{cat.count}</TableCell>
                  <TableCell className="text-right">{formatCurrency(cat.total)}</TableCell>
                  <TableCell className="text-right">
                    {totalCollected > 0 ? ((cat.total / totalCollected) * 100).toFixed(1) : 0}%
                  </TableCell>
                </TableRow>
              ))}
              {expenseCategories.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-foreground">
                    No expenses recorded yet. Add deductions to Commission Plans or use the "Adjust" button in Audit Log.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
