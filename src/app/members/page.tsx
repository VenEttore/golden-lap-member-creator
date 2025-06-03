"use client";
import MemberCreatorModern from '../../components/MemberCreator/MemberCreatorModern';
import { useSearchParams } from 'next/navigation';
import { getMembers } from '../../utils/memberStorage';
import { useEffect, useState } from 'react';

export default function MembersPage() {
  const searchParams = useSearchParams();
  const [initialValues, setInitialValues] = useState<any>({});

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
      const vals: any = {};
      if (searchParams.has('name')) vals.name = searchParams.get('name') || '';
      if (searchParams.has('surname')) vals.surname = searchParams.get('surname') || '';
      if (searchParams.has('country')) vals.country = (searchParams.get('country') || '').toUpperCase();
      if (searchParams.has('type')) vals.type = searchParams.get('type') as any;
      if (searchParams.has('careerStage')) vals.careerStage = searchParams.get('careerStage') || '';
      if (searchParams.has('portraitName')) vals.portraitName = searchParams.get('portraitName') || '';
      if (searchParams.has('decadeStartContent')) vals.decadeStartContent = searchParams.get('decadeStartContent') === 'true';
      if (searchParams.has('traits')) {
        const traitsRaw = searchParams.get('traits') || '';
        try {
          vals.traits = JSON.parse(traitsRaw);
        } catch {
          vals.traits = traitsRaw.split(',').map((s: string) => s.trim()).filter(Boolean);
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