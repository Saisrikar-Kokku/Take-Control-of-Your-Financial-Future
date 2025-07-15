"use client";

import { useRef, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const EXPENSE_CATEGORIES = [
  'Food & Dining',
  'Transportation',
  'Shopping',
  'Entertainment',
  'Bills & Utilities',
  'Healthcare',
  'Education',
  'Travel',
  'Groceries',
  'Other'
];

const BUDGET_PERIODS = [
  'weekly',
  'monthly',
  'yearly'
];

export default function ScanReceiptPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [ocrText, setOcrText] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    amount: '',
    date: '',
    category: '',
    description: '',
    period: ''
  });
  const [loading, setLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && (file.type === "image/jpeg" || file.type === "image/png")) {
      setSelectedImage(file);
      setPreviewUrl(URL.createObjectURL(file));
      setOcrText(null);
      setFormData({ amount: '', date: '', category: '', description: '', period: '' });
      setError(null);
    } else {
      setSelectedImage(null);
      setPreviewUrl(null);
      setOcrText(null);
      setFormData({ amount: '', date: '', category: '', description: '', period: '' });
      setError(null);
    }
  };

  const handleCameraClick = () => {
    fileInputRef.current?.click();
  };

  const handleExtractAI = async () => {
    if (!ocrText) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/gemini-extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: ocrText }),
      });
      const data = await res.json();
      if (res.ok) {
        setFormData({
          amount: data.amount?.toString() || '',
          date: data.date || '',
          category: data.category || '',
          description: data.description || '',
          period: data.period || ''
        });
      } else {
        setError(data.error || "Failed to extract fields");
      }
    } catch (err) {
      setError("Failed to extract fields");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveLoading(true);
    setSaveSuccess(false);
    setError(null);
    if (!user) {
      setError('You must be logged in to save expenses.');
      setSaveLoading(false);
      return;
    }
    if (!formData.amount || !formData.date || !formData.category || !formData.period) {
      setError('Please fill in all required fields.');
      setSaveLoading(false);
      return;
    }
    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount <= 0) {
      setError('Please enter a valid amount greater than 0');
      setSaveLoading(false);
      return;
    }
    try {
      // Insert expense (without period)
      const { error: insertError } = await supabase
        .from('expenses')
        .insert([
          {
            user_id: user.id,
            amount: amount,
            category: formData.category,
            description: formData.description || null,
            date: formData.date
          }
        ]);
      if (insertError) {
        setError(insertError.message);
      } else {
        setSaveSuccess(true);
        // Update the budget after successful expense insert
        if (formData.period && formData.category) {
          try {
            // Fetch the budget for the selected category and period
            const { data: budget, error: budgetError } = await supabase
              .from('budgets')
              .select('id, amount')
              .eq('user_id', user.id)
              .eq('category', formData.category)
              .eq('period', formData.period)
              .single();
            if (budget && !budgetError) {
              const newAmount = budget.amount - amount;
              await supabase
                .from('budgets')
                .update({ amount: newAmount })
                .eq('id', budget.id);
            }
          } catch (err) {
            // Silent fail for budget update
          }
        }
        setTimeout(() => {
          router.push('/expenses');
        }, 1500);
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setSaveLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader>
          <CardTitle>Scan Expense Receipt</CardTitle>
        </CardHeader>
        <CardContent>
          <form>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png"
              capture="environment"
              className="hidden"
              onChange={handleFileChange}
            />
            <div className="flex flex-col items-center gap-4">
              <Button type="button" onClick={handleCameraClick} className="w-full">
                {selectedImage ? "Retake Photo" : "Take Photo / Upload Image"}
              </Button>
              {previewUrl && (
                <div className="w-full flex flex-col items-center gap-4">
                  <Image
                    src={previewUrl}
                    alt="Receipt Preview"
                    width={240}
                    height={240}
                    className="rounded border object-contain"
                  />
                  {!ocrText && (
                    <Button
                      type="button"
                      className="w-full"
                      onClick={async () => {
                        setLoading(true);
                        setError(null);
                        try {
                          // Send to OCR API
                          const formDataImg = new FormData();
                          formDataImg.append("file", selectedImage!);
                          const res = await fetch("/api/ocr-receipt", {
                            method: "POST",
                            body: formDataImg,
                          });
                          const data = await res.json();
                          if (res.ok) {
                            setOcrText(data.text);
                          } else {
                            setError(data.error || "Failed to extract text");
                          }
                        } catch (err) {
                          setError("Failed to extract text");
                        } finally {
                          setLoading(false);
                        }
                      }}
                      disabled={loading}
                    >
                      {loading ? 'Extracting text...' : 'Extract Text from Image'}
                    </Button>
                  )}
                  {ocrText && !loading && (
                    <div className="w-full bg-gray-100 rounded p-2 mt-2 text-xs whitespace-pre-wrap">
                      <strong>Extracted Text:</strong>
                      <div>{ocrText}</div>
                      <Button
                        type="button"
                        className="mt-2 w-full"
                        onClick={handleExtractAI}
                        disabled={loading}
                      >
                        {loading ? 'Analyzing with AI...' : 'Extract Details with AI'}
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </form>
          <form
            className="w-full bg-white rounded p-2 mt-4 text-sm flex flex-col gap-2 border"
            onSubmit={handleSubmit}
            autoComplete="off"
          >
            <div className="font-semibold mb-1">Confirm & Edit Details</div>
            <label>
              Amount:
              <input
                type="number"
                className="ml-2 border rounded px-2 py-1 w-32"
                value={formData.amount}
                onChange={e => setFormData(f => ({ ...f, amount: e.target.value }))}
                min="0"
                step="0.01"
                required
              />
            </label>
            <label>
              Date:
              <input
                type="date"
                className="ml-2 border rounded px-2 py-1 w-40"
                value={formData.date}
                onChange={e => setFormData(f => ({ ...f, date: e.target.value }))}
                required
              />
            </label>
            <label>
              Category:
              <Select value={formData.category} onValueChange={value => setFormData(f => ({ ...f, category: value }))}>
                <SelectTrigger className="ml-2 w-40">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {EXPENSE_CATEGORIES.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </label>
            <label>
              Period:
              <Select value={formData.period} onValueChange={value => setFormData(f => ({ ...f, period: value }))}>
                <SelectTrigger className="ml-2 w-40">
                  <SelectValue placeholder="Select a period" />
                </SelectTrigger>
                <SelectContent>
                  {BUDGET_PERIODS.map((period) => (
                    <SelectItem key={period} value={period}>
                      {period.charAt(0).toUpperCase() + period.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </label>
            <label>
              Description:
              <textarea
                className="ml-2 border rounded px-2 py-1 w-full mt-1"
                value={formData.description}
                onChange={e => setFormData(f => ({ ...f, description: e.target.value }))}
                rows={2}
                maxLength={200}
                placeholder="Add a note about this expense..."
              />
            </label>
            <div className="flex gap-2 mt-2">
              <Button type="submit" disabled={saveLoading || !formData.amount || !formData.date || !formData.category || !formData.period} className="w-full">
                {saveLoading ? 'Saving...' : 'Save Expense'}
              </Button>
            </div>
            {saveSuccess && <div className="text-green-600 text-sm mt-1">Expense saved! Redirecting...</div>}
            {error && <div className="text-red-600 text-sm mt-1">{error}</div>}
          </form>
        </CardContent>
      </Card>
    </div>
  );
} 