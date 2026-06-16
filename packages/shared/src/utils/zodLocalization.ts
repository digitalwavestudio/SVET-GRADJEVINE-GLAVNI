import { z } from "zod";

export const zodSerbianErrorMap: z.ZodErrorMap = (issue) => {
  let message: string;
  switch (issue.code) {
    case 'invalid_type':
      if (issue.received === 'undefined' || issue.received === 'null') {
        message = "Ovo polje je obavezno";
      } else {
        message = `Očekivani tip ${issue.expected}, primljen ${issue.received}`;
      }
      break;
    case 'invalid_value':
      if ('values' in issue) {
        message = "Neispravna opcija";
      } else {
        message = "Neispravna vrednost";
      }
      break;
    case 'unrecognized_keys':
      message = `Nepoznati ključevi: ${issue.keys.join(", ")}`;
      break;
    case 'invalid_union':
      message = "Neispravan unos";
      break;
    case 'invalid_format':
      if (issue.format === 'email') message = "Neispravna email adresa";
      else if (issue.format === 'url') message = "Neispravan URL";
      else if (issue.format === 'uuid') message = "Neispravan UUID";
      else message = "Neispravan format";
      break;
    case 'too_small':
      if (issue.minimum === 1) {
        message = "Ovo polje je obavezno";
      } else if (issue.origin === 'string')
        message = `Mora imati barem ${issue.minimum} karaktera`;
      else if (issue.origin === 'array')
        message = `Mora imati barem ${issue.minimum} elemenata`;
      else
        message = `Vrednost mora biti veća ili jednaka ${issue.minimum}`;
      break;
    case 'too_big':
      if (issue.origin === 'string')
        message = `Može imati najviše ${issue.maximum} karaktera`;
      else if (issue.origin === 'array')
        message = `Može imati najviše ${issue.maximum} elemenata`;
      else
        message = `Vrednost mora biti manja ili jednaka ${issue.maximum}`;
      break;
    case 'not_multiple_of':
      message = `Mora biti deljivo sa ${issue.divisor}`;
      break;
    case 'custom':
      message = issue.message || "Neispravan unos";
      break;
    default:
      message = "Neispravan unos";
  }
  return { message };
};

export const initZodLocalization = () => {
  z.setErrorMap(zodSerbianErrorMap);
};
