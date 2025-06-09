"use client";
import React, { Suspense } from 'react';
import MemberCreatorModern from '../../components/MemberCreator/MemberCreatorModern';
import { useSearchParams } from 'next/navigation';
import { getMembers, Member } from '../../utils/memberStorage';
import { useEffect, useState } from 'react';

function MembersPageInner() {
  const searchParams = useSearchParams();
  const [initialValues, setInitialValues] = useState<Partial<Member>>({});

  useEffect(() => {
    async function loadInitialValues() {
      if (searchParams.has('id')) {
        const id = searchParams.get('id') || '';
        const members = await getMembers();
        const member = members.find(m => m.id === id);
        if (member) {
          setInitialValues({ ...member });
          return;
        }
      }
      // Parse all relevant query params
      const vals: Partial<Member> = {};
      if (searchParams.has('name')) vals.name = searchParams.get('name') || '';
      if (searchParams.has('surname')) vals.surname = searchParams.get('surname') || '';
      if (searchParams.has('country')) vals.country = (searchParams.get('country') || '').toUpperCase();
      if (searchParams.has('type')) vals.type = searchParams.get('type') as Member['type'];
      if (searchParams.has('careerStage')) vals.careerStage = searchParams.get('careerStage') || '';
      if (searchParams.has('portraitName')) vals.portraitName = searchParams.get('portraitName') || '';
      if (searchParams.has('decadeStartContent')) vals.decadeStartContent = searchParams.get('decadeStartContent') === 'true';
      if (searchParams.has('traits')) {
        const traitsRaw = searchParams.get('traits') || '';
        try {
          const parsed = JSON.parse(traitsRaw);
          // Ensure category field exists
          if (Array.isArray(parsed)) {
            vals.traits = parsed.map((trait: Partial<Member["traits"][number]>) => ({
              name: typeof trait.name === 'string' ? trait.name : '',
              display_name: typeof trait.display_name === 'string' ? trait.display_name : '',
              description: typeof trait.description === 'string' ? trait.description : '',
              category: typeof trait.category === 'string' ? trait.category : ''
            }));
          } else {
            vals.traits = parsed;
          }
        } catch {
          vals.traits = traitsRaw.split(',').map((s: string) => s.trim()).filter(Boolean).map((name: string) => ({ name, display_name: name, description: '', category: '' }));
        }
      }
      if (searchParams.has('stats')) {
        try {
          vals.stats = JSON.parse(searchParams.get('stats') || '{}');
        } catch { vals.stats = {}; }
      }
      setInitialValues(vals);
    }
    loadInitialValues();
  }, [searchParams]);

  return <MemberCreatorModern initialValues={initialValues} />;
}

export default function MembersPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <MembersPageInner />
    </Suspense>
  );
} 