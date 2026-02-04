import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface Pillar {
  id: number;
  title: string;
  image: string;
  description: string;
  tips: string[];
}

const pillars: Pillar[] = [
  {
    id: 1,
    title: 'Consistent Agent Names',
    image: 'https://private-us-east-1.manuscdn.com/sessionFile/2M9ZON4BiqCgb8xPdGRMCy/sandbox/w1IMqOsa5Ih1FBPlGtx9cj-img-1_1770239436000_na1fn_cGlsbGFyLTEtYWdlbnQtbmFtZXM.png?x-oss-process=image/resize,w_1920,h_1920/format,webp/quality,q_80&Expires=1798761600&Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly9wcml2YXRlLXVzLWVhc3QtMS5tYW51c2Nkbi5jb20vc2Vzc2lvbkZpbGUvMk05Wk9ONEJpcUNnYjh4UGRHUk1DeS9zYW5kYm94L3cxSU1xT3NhNUloMUZCUGxHdHg5Y2otaW1nLTFfMTc3MDIzOTQzNjAwMF9uYTFmbl9jR2xzYkdGeUxURXRZV2RsYm5RdGJtRnRaWE0ucG5nP3gtb3NzLXByb2Nlc3M9aW1hZ2UvcmVzaXplLHdfMTkyMCxoXzE5MjAvZm9ybWF0LHdlYnAvcXVhbGl0eSxxXzgwIiwiQ29uZGl0aW9uIjp7IkRhdGVMZXNzVGhhbiI6eyJBV1M6RXBvY2hUaW1lIjoxNzk4NzYxNjAwfX19XX0_&Key-Pair-Id=K2HSFNDJXOU9YS&Signature=OXyETItkaB~2SEB2uVHptifrZc4ajY3uWgeYqVmnvaTwG3JHpkv1JUKehl0Am-0vi6q1KToUF-cpfnRa08czvpwVH6oTvby1uopBvRVNl1gbc1N760iGKX7sqhPg312CzNxNhFoo-LRUDeV4mlBfEsbjnElcW~URHyy0LeP6D~ZmZFKpk6Q8nYDUaHro6LvEsWbMxN2~VgLcVqzuE65dxpZysSruBKyzAIxHQheE4w~bizqnlFWn6cpX9OhIAaBTjX-qPOXk1N2-sthP6YS3Mb5OOaTSP-C-fLft9eZZdsmIo8F-xQnWl~jzJy0PFcuJvWIOqFwn8XbBCExvQsR9YQ__',
    description: 'Use the same name format for each agent throughout your CSV. Inconsistent formatting can cause data mismatches and reporting errors.',
    tips: [
      'Use "First Last" format consistently (e.g., "John Smith")',
      'Avoid abbreviations or nicknames',
      'Don\'t mix case formats (avoid "john smith" vs "JOHN SMITH")',
      'Keep agent names exactly as they appear in your system'
    ]
  },
  {
    id: 2,
    title: 'Accurate Date Formatting',
    image: 'https://private-us-east-1.manuscdn.com/sessionFile/2M9ZON4BiqCgb8xPdGRMCy/sandbox/w1IMqOsa5Ih1FBPlGtx9cj-img-2_1770239435000_na1fn_cGlsbGFyLTItZGF0ZXM.png?x-oss-process=image/resize,w_1920,h_1920/format,webp/quality,q_80&Expires=1798761600&Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly9wcml2YXRlLXVzLWVhc3QtMS5tYW51c2Nkbi5jb20vc2Vzc2lvbkZpbGUvMk05Wk9ONEJpcUNnYjh4UGRHUk1DeS9zYW5kYm94L3cxSU1xT3NhNUloMUZCUGxHdHg5Y2otaW1nLTJfMTc3MDIzOTQzNTAwMF9uYTFmbl9jR2xzYkdGeUxUSXRaR0YwWlhNLnBuZz94LW9zcy1wcm9jZXNzPWltYWdlL3Jlc2l6ZSx3XzE5MjAsaF8xOTIwL2Zvcm1hdCx3ZWJwL3F1YWxpdHkscV84MCIsIkNvbmRpdGlvbiI6eyJEYXRlTGVzc1RoYW4iOnsiQVdTOkVwb2NoVGltZSI6MTc5ODc2MTYwMH19fV19&Key-Pair-Id=K2HSFNDJXOU9YS&Signature=h5S0igtCHOMP~L4pWhyP0-EOvcUEY11l8abWxgYMpySmsaNgYJ~mwUfKB7pbGeQ8yeWdxCwp05BHJVIXguh~3LzZTKqSR9C-7ohvvh1HcKb2a3pZ4Y703-IBzHPmxQm4EXxwKpkm-nXOBlsqry9DO2ndLN0hOsBX7-Knvz3XiJY3QTWbYg16Od5rRp0QoB~BvCwJwFcYgtLlRQ3gUo3~KTXz~6TI4DqjP3Y9yMFSVAMfUIZLjM1cb2m0qUhNUc0I9IQ3r8sGG2dc06wShvYM-ud3pskW7vW9cnkE6fIdQD9DqEC-bnq~8neRcJJURnjEcF5HCqymxlSlDZqT69Mzpg__',
    description: 'All dates must be in MM/DD/YYYY format. Different date formats can cause parsing errors and incorrect calculations.',
    tips: [
      'Always use MM/DD/YYYY format (e.g., 01/15/2024)',
      'Include leading zeros for single-digit months and days',
      'Don\'t use dashes or dots as separators',
      'Verify dates are valid (no 13/32/2024)'
    ]
  },
  {
    id: 3,
    title: 'Numeric Data Without Formatting',
    image: 'https://private-us-east-1.manuscdn.com/sessionFile/2M9ZON4BiqCgb8xPdGRMCy/sandbox/w1IMqOsa5Ih1FBPlGtx9cj-img-3_1770239431000_na1fn_cGlsbGFyLTMtbnVtZXJpYw.png?x-oss-process=image/resize,w_1920,h_1920/format,webp/quality,q_80&Expires=1798761600&Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly9wcml2YXRlLXVzLWVhc3QtMS5tYW51c2Nkbi5jb20vc2Vzc2lvbkZpbGUvMk05Wk9ONEJpcUNnYjh4UGRHUk1DeS9zYW5kYm94L3cxSU1xT3NhNUloMUZCUGxHdHg5Y2otaW1nLTNfMTc3MDIzOTQzMTAwMF9uYTFmbl9jR2xzYkdGeUxUTXRiblZ0WlhKcFl3LnBuZz94LW9zcy1wcm9jZXNzPWltYWdlL3Jlc2l6ZSx3XzE5MjAsaF8xOTIwL2Zvcm1hdCx3ZWJwL3F1YWxpdHkscV84MCIsIkNvbmRpdGlvbiI6eyJEYXRlTGVzc1RoYW4iOnsiQVdTOkVwb2NoVGltZSI6MTc5ODc2MTYwMH19fV19&Key-Pair-Id=K2HSFNDJXOU9YS&Signature=PTZwzmvPTYr7gBb~jiZ5apYiTXFsZ~wmH1OPmGtAo41lbcWINkoighX0XZTq2yHZWUfICKgBMmlF1xoa~o8rgmebgXEq8uGdJuUx8pAcVJmc2d0TWs-92RAvLm9PgkV~mTHAfN6pbznzqh7b0DGE18zWzYmkD1C8yYCGZf8J1BBoiR7lEv61ti17mSByjmEsMUHPAAHr~KdJbt92uGfWAr0Y2FjOw0vPbt9HTp7WJ-2lR2fhyiG74KtpKwd7156dPoME1MTm5BAxPJ0UfxPG9gOtRtXAPWjpTJkD6EPZsNXnaa~vG5ilMSgNP0utaHwdYKBGNCoDdvale8V1vDqwSw__',
    description: 'Enter prices and percentages as numbers only, without currency symbols, commas, or percent signs.',
    tips: [
      'Price: Enter as 500000, not $500,000',
      'Commission Rate: Enter as 3, not 0.03 or 3%',
      'Percentages: Enter as 25, not 25% or 0.25',
      'Remove all formatting before uploading'
    ]
  },
  {
    id: 4,
    title: 'Standardized Status Values',
    image: 'https://private-us-east-1.manuscdn.com/sessionFile/2M9ZON4BiqCgb8xPdGRMCy/sandbox/w1IMqOsa5Ih1FBPlGtx9cj-img-4_1770239427000_na1fn_cGlsbGFyLTQtc3RhdHVz.png?x-oss-process=image/resize,w_1920,h_1920/format,webp/quality,q_80&Expires=1798761600&Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly9wcml2YXRlLXVzLWVhc3QtMS5tYW51c2Nkbi5jb20vc2Vzc2lvbkZpbGUvMk05Wk9ONEJpcUNnYjh4UGRHUk1DeS9zYW5kYm94L3cxSU1xT3NhNUloMUZCUGxHdHg5Y2otaW1nLTRfMTc3MDIzOTQyNzAwMF9uYTFmbl9jR2xzYkdGeUxUUXRjM1JoZEhWei5wbmc~eC1vc3MtcHJvY2Vzcz1pbWFnZS9yZXNpemUsd18xOTIwLGhfMTkyMC9mb3JtYXQsd2VicC9xdWFsaXR5LHFfODAiLCJDb25kaXRpb24iOnsiRGF0ZUxlc3NUaGFuIjp7IkFXUzpFcG9jaFRpbWUiOjE3OTg3NjE2MDB9fX1dfQ__&Key-Pair-Id=K2HSFNDJXOU9YS&Signature=j3J421zgiZaHGUUz~PVyvD2VSrHoJh2Dtco6~2p5aieqpHWqUa2QcExatGW8uyrrbQmgI1qMoAgJt6rYXYhEOxm1HrYwfMWJ~wJ2gbgaS-q4x1a4OFrIZoRKpYadYdsw5GiiJurfkEqnKskJ-Tz0QtaNNSLTHH-rFXyXT5jG8qhVYkPmTtmRvJhMSXKcIt0ryFy20foOBdPAGWMp-8aYzUdXcV0pr4fH0zftR1dnRhET2r~v-0K-EPTtyYVwiYy-qixKC7n6nafjrQgfHHGvnA~RpaMFBp2c9QTGgTbLQ5sZ2KkOjtyC9OGJ4IjB7zKJuPm6EeqBlfMQPC-nnvwzBg__',
    description: 'Use consistent status values across all transactions. Valid statuses are: Active, Pending, Closed, Sold, Archived, Withdrawn.',
    tips: [
      'Use exact values: Active, Pending, Closed, Sold, Archived, Withdrawn',
      'Match case exactly (not "active" or "ACTIVE")',
      'Don\'t use variations like "In Progress", "Done", or "Finished"',
      'Verify all transactions use one of the standard values'
    ]
  },
  {
    id: 5,
    title: 'Complete Agent Lists',
    image: 'https://private-us-east-1.manuscdn.com/sessionFile/2M9ZON4BiqCgb8xPdGRMCy/sandbox/w1IMqOsa5Ih1FBPlGtx9cj-img-5_1770239433000_na1fn_cGlsbGFyLTUtYWdlbnRz.png?x-oss-process=image/resize,w_1920,h_1920/format,webp/quality,q_80&Expires=1798761600&Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly9wcml2YXRlLXVzLWVhc3QtMS5tYW51c2Nkbi5jb20vc2Vzc2lvbkZpbGUvMk05Wk9ONEJpcUNnYjh4UGRHUk1DeS9zYW5kYm94L3cxSU1xT3NhNUloMUZCUGxHdHg5Y2otaW1nLTVfMTc3MDIzOTQzMzAwMF9uYTFmbl9jR2xzYkdGeUxUVXRZV2RsYm5Rei5wbmc~eC1vc3MtcHJvY2Vzcz1pbWFnZS9yZXNpemUsd18xOTIwLGhfMTkyMC9mb3JtYXQsd2VicC9xdWFsaXR5LHFfODAiLCJDb25kaXRpb24iOnsiRGF0ZUxlc3NUaGFuIjp7IkFXUzpFcG9jaFRpbWUiOjE3OTg3NjE2MDB9fX1dfQ__&Key-Pair-Id=K2HSFNDJXOU9YS&Signature=r61zq3dp2j4sTYu8t66zWFziFBUJELyMl-ln93OTHZEzCuydRVw~97cT4GDa3yO9Defk7PZQ~f9pUgEtNI~e9p9wBCtJy25vVpPp2AOHBpeMMR-IWa6hlo0wtoqoMyisyD0-wUrb9gI4Rr-wAOHi6dD~RoH4Mx6P3d1x-LZMlBgS4KRC4qrOoj6LcCMeORtji5Az7r4mowmjHZJ2Wn7h4aiRkMZDSM07pg~IDsn8l2-WmukSv3e9S3omWOXbFgs7Q4uYPjxyBf6~n9iabIqgK~3CfMoPUQV4pQdPSj6~0tSY7ICy-gDGwivfcRt6F6yf0ct0xoHovyphAIuTpgBYvQ__',
    description: 'For multi-agent transactions, list all agents separated by commas. Missing agents can skew commission calculations.',
    tips: [
      'Use comma-separated format: "John Smith, Sarah Johnson, Mike Davis"',
      'Include all agents involved in the transaction',
      'Don\'t use semicolons or other separators',
      'Avoid trailing commas or extra spaces'
    ]
  }
];

interface CSVPreparationGuideProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CSVPreparationGuide({ isOpen, onClose }: CSVPreparationGuideProps) {
  const [currentPillar, setCurrentPillar] = useState(0);

  if (!isOpen) return null;

  const handleNext = () => {
    if (currentPillar < pillars.length - 1) {
      setCurrentPillar(currentPillar + 1);
    }
  };

  const handlePrev = () => {
    if (currentPillar > 0) {
      setCurrentPillar(currentPillar - 1);
    }
  };

  const pillar = pillars[currentPillar];

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-background rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-background border-b border-border p-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground">CSV Preparation Guide</h2>
            <p className="text-sm text-foreground/60">Learn the 5 pillars of data quality. Step {currentPillar + 1} of {pillars.length}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-card rounded-lg transition-colors"
          >
            <X className="h-6 w-6 text-foreground" />
          </button>
        </div>

        {/* Content */}
        <div className="p-8 space-y-8">
          {/* Image Section */}
          <div className="relative bg-background/50 rounded-lg overflow-hidden aspect-video">
            <img
              src={pillar.image}
              alt={pillar.title}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Text Content */}
          <div className="space-y-6">
            <div className="space-y-3">
              <h3 className="text-3xl font-bold text-foreground">{pillar.title}</h3>
              <p className="text-lg text-foreground/80 leading-relaxed">{pillar.description}</p>
            </div>

            {/* Tips */}
            <div className="space-y-4">
              <h4 className="font-semibold text-foreground text-lg">Key Tips:</h4>
              <ul className="space-y-3">
                {pillar.tips.map((tip, idx) => (
                  <li key={idx} className="flex gap-3 text-foreground/70">
                    <span className="text-primary font-bold flex-shrink-0">✓</span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Progress Indicator */}
          <div className="flex gap-2 justify-center py-6">
            {pillars.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentPillar(idx)}
                className={`h-2 rounded-full transition-all ${
                  idx === currentPillar
                    ? 'bg-primary w-8'
                    : 'bg-border w-2 hover:bg-border/80'
                }`}
                aria-label={`Go to pillar ${idx + 1}`}
              />
            ))}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between pt-6 border-t border-border">
            <Button
              variant="outline"
              onClick={handlePrev}
              disabled={currentPillar === 0}
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Previous
            </Button>

            <div className="text-sm text-foreground/60">
              {currentPillar + 1} of {pillars.length}
            </div>

            <Button
              variant="outline"
              onClick={handleNext}
              disabled={currentPillar === pillars.length - 1}
            >
              Next
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
