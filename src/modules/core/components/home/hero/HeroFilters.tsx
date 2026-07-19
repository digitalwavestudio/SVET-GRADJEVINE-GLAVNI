import React from "react";
import {
  Briefcase,
  Building2,
  Tractor,
  Map,
  Store,
  MapPin,
  Layers,
  Users,
  ArrowRight,
} from "lucide-react";
import CustomSelect from "@/src/modules/core/components/home/CustomSelect";
import {
  SECTORS,
  LOCATIONS,
  REAL_ESTATE_PURPOSES,
} from "@/src/constants/taxonomy";
import { MACHINE_CATEGORIES } from "@/src/constants/machineTaxonomy";
import { COMPANY_MAIN_CATEGORIES } from "@/src/constants/companyTaxonomy";
import { HeroTabType } from "@/src/modules/core/hooks/useHeroSearch";

interface HeroFiltersProps {
  activeTab: HeroTabType;
  showFilters: boolean;
  onSearch: () => void;
  filters: {
    selectedLocation: string;
    setSelectedLocation: (val: string) => void;
    selectedSector: string;
    setSelectedSector: (val: string) => void;
    selectedProfession: string;
    setSelectedProfession: (val: string) => void;

    selectedMainCat: string;
    setSelectedMainCat: (val: string) => void;
    selectedSize: string;
    setSelectedSize: (val: string) => void;
    selectedCapacity: string;
    setSelectedCapacity: (val: string) => void;
    selectedPurpose: string;
    setSelectedPurpose: (val: string) => void;
    selectedMachineCat: string;
    setSelectedMachineCat: (val: string) => void;
    selectedMarketCat: string;
    setSelectedMarketCat: (val: string) => void;
    availableProfessions: any[];
  };
}

export const HeroFilters: React.FC<HeroFiltersProps> = ({
  activeTab,
  showFilters,
  onSearch,
  filters,
}) => {
  const {
    selectedLocation,
    setSelectedLocation,
    selectedSector,
    setSelectedSector,
    selectedProfession,
    setSelectedProfession,

    selectedMainCat,
    setSelectedMainCat,
    selectedSize,
    setSelectedSize,
    selectedCapacity,
    setSelectedCapacity,
    selectedPurpose,
    setSelectedPurpose,
    selectedMachineCat,
    setSelectedMachineCat,
    selectedMarketCat,
    setSelectedMarketCat,
    availableProfessions,
  } = filters;

  return (
    <div
      className={`grid transition-[grid-template-rows] duration-400 ease-[0.16,1,0.3,1] ${
        showFilters ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
      }`}
    >
      <div className="overflow-hidden">
        <div className="py-4 relative">
            {/* Selected Tab Specific Filters */}
            {activeTab === "poslovi" || activeTab === "majstori" ? (
              <div className="flex flex-col gap-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <CustomSelect
                    value={selectedSector}
                    onChange={(val) => {
                      setSelectedSector(val);
                      setSelectedProfession("");
                    }}
                    options={SECTORS.map((s: any) => ({
                      value: s.slug,
                      label: s.name,
                    }))}
                    placeholder="Svi sektori"
                    icon={<Layers size={20} />}
                    label="Sektor"
                  />
                  <CustomSelect
                    value={selectedProfession}
                    onChange={setSelectedProfession}
                    options={availableProfessions.map((p: any) => ({
                      value: p.slug,
                      label: p.name,
                    }))}
                    placeholder={
                      !selectedSector ? "Izaberite sektor" : "Sva zanimanja"
                    }
                    icon={<Briefcase size={20} />}
                    label="Zanimanje"
                    disabled={!selectedSector}
                  />
                  <CustomSelect
                    value={selectedLocation}
                    onChange={setSelectedLocation}
                    options={LOCATIONS.map((l: any) => ({
                      value: l.slug,
                      label: l.name,
                    }))}
                    placeholder="Cela Srbija"
                    icon={<MapPin size={20} />}
                    label="Lokacija"
                  />
                </div>

              </div>
            ) : activeTab === "firme" ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <CustomSelect
                  value={selectedMainCat}
                  onChange={setSelectedMainCat}
                  options={COMPANY_MAIN_CATEGORIES.map((s: any) => ({
                    value: s.id,
                    label: s.name,
                  }))}
                  placeholder="Svi sektori poslovanja"
                  icon={<Building2 size={20} />}
                  label="Sektor Firme"
                />
                <CustomSelect
                  value={selectedLocation}
                  onChange={setSelectedLocation}
                  options={LOCATIONS.map((l: any) => ({
                    value: l.slug,
                    label: l.name,
                  }))}
                  placeholder="Cela Srbija"
                  icon={<MapPin size={20} />}
                  label="Sedište"
                />
              </div>
            ) : activeTab === "masine" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <CustomSelect
                  value={selectedMachineCat}
                  onChange={setSelectedMachineCat}
                  options={MACHINE_CATEGORIES.map((s: any) => ({
                    value: s.id,
                    label: s.name,
                  }))}
                  placeholder="Sve kategorije alata"
                  icon={<Tractor size={20} />}
                  label="Kategorija mašine"
                />
                <CustomSelect
                  value={selectedLocation}
                  onChange={setSelectedLocation}
                  options={LOCATIONS.map((l: any) => ({
                    value: l.slug,
                    label: l.name,
                  }))}
                  placeholder="Cela Srbija"
                  icon={<MapPin size={20} />}
                  label="Lokacija"
                />
              </div>
            ) : activeTab === "placevi" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <CustomSelect
                  value={selectedPurpose}
                  onChange={setSelectedPurpose}
                  options={REAL_ESTATE_PURPOSES.map((s: any) => ({
                    value: s.id,
                    label: s.name,
                  }))}
                  placeholder="Sve namene zemljišta"
                  icon={<Map size={20} />}
                  label="Namena zemljišta"
                />
                <CustomSelect
                  value={selectedLocation}
                  onChange={setSelectedLocation}
                  options={LOCATIONS.map((l: any) => ({
                    value: l.slug,
                    label: l.name,
                  }))}
                  placeholder="Cela Srbija"
                  icon={<MapPin size={20} />}
                  label="Lokacija"
                />
              </div>
            ) : activeTab === "smestaj" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <CustomSelect
                  value={selectedCapacity}
                  onChange={setSelectedCapacity}
                  options={[
                    { value: "5", label: "Do 5 osoba" },
                    { value: "10", label: "Do 10 osoba" },
                    { value: "20", label: "Do 20 osoba" },
                    { value: "50", label: "50+ osoba" },
                  ]}
                  placeholder="Bilo koji kapacitet"
                  icon={<Users size={20} />}
                  label="Kapacitet radnika"
                />
                <CustomSelect
                  value={selectedLocation}
                  onChange={setSelectedLocation}
                  options={LOCATIONS.map((l: any) => ({
                    value: l.slug,
                    label: l.name,
                  }))}
                  placeholder="Cela Srbija"
                  icon={<MapPin size={20} />}
                  label="Lokacija"
                />
              </div>
            ) : activeTab === "ketering" ? (
              <div className="grid grid-cols-1 md:grid-cols-1 gap-3">
                <CustomSelect
                  value={selectedLocation}
                  onChange={setSelectedLocation}
                  options={LOCATIONS.map((l: any) => ({
                    value: l.slug,
                    label: l.name,
                  }))}
                  placeholder="Cela Srbija"
                  icon={<MapPin size={20} />}
                  label="Lokacija za isporuku"
                />
              </div>
            ) : null}

            {/* Search Button for Filters */}
            <div className="mt-8 flex justify-center">
              <button
                type="button"
                onClick={onSearch}
                className="h-12 md:h-16 bg-secondary text-[#0d151c] px-6 md:px-16 rounded-[10px] font-headline font-black uppercase italic tracking-tighter text-sm sm:text-base md:text-xl transition-all duration-500 hover:bg-[#ffad3a] hover:scale-105 active:scale-95 shadow-gold-glow-lg flex items-center justify-center gap-3 group"
              >
                <span>Prikaži rezultate</span>
                <ArrowRight
                  size={20}
                  strokeWidth={3}
                  className="group-hover:translate-x-2 transition-transform duration-500 md:w-6 md:h-6"
                />
              </button>
        </div>
      </div>
    </div>
  </div>
  );
};
