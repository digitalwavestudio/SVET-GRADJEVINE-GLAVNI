import { createAdSchema } from '../packages/shared/src/schemas.ts';

const payload = {
  category: 'companies',
  data: {
    type: 'company',
    authorId: '123',
    status: 'active',
    isPremium: true,
    companyName: 'neko_ime',
    companyPIB: '',
    companyDescription: '',
    companyAddress: '',
    portfolioImages: [],
    images: [],
    location: '',
  }
};

try {
  createAdSchema.parse(payload);
  console.log("SUCCESS");
} catch(e) {
  const err = e as { errors: unknown };
  console.log("VALIDATION ERROR:");
  console.dir(err.errors, {depth: null});
}
