import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { PROFESSIONS } from "@/src/constants/taxonomy";

export type HeroTabType =
  | "poslovi"
  | "firme"
  | "smestaj"
  | "ketering"
  | "placevi"
  | "masine"
  | "alat-i-oprema"
  | "majstori";

export function useHeroSearch() {
  const navigate = useNavigate();
  const [globalQuery, setGlobalQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [activeTab, setActiveTab] = useState<HeroTabType>("poslovi");

  // Shared Filters
  const [selectedLocation, setSelectedLocation] = useState("");

  // Poslovi / Majstori Filters
  const [selectedSector, setSelectedSector] = useState("");
  const [selectedProfession, setSelectedProfession] = useState("");


  // Firme Filters
  const [selectedMainCat, setSelectedMainCat] = useState("");
  const [selectedSize, setSelectedSize] = useState("");

  // Smeštaj Filters
  const [selectedCapacity, setSelectedCapacity] = useState("");
  // Placevi
  const [selectedPurpose, setSelectedPurpose] = useState("");
  // Masine
  const [selectedMachineCat, setSelectedMachineCat] = useState("");
  // Alat i oprema
  const [selectedMarketCat, setSelectedMarketCat] = useState("");

  const availableProfessions = selectedSector
    ? (PROFESSIONS as any)[selectedSector] || []
    : [];

  const handleCategorySearch = () => {
    switch (activeTab) {
      case "poslovi":
        navigate("/poslovi", {
          state: {
            filters: {
              sector: selectedSector,
              profession: selectedProfession,
              location: selectedLocation,

            },
          },
        });
        break;
      case "majstori":
        navigate("/majstori", {
          state: {
            filters: {
              sector: selectedSector,
              profession: selectedProfession,
              location: selectedLocation,
            },
          },
        });
        break;
      case "firme":
        navigate("/firme", {
          state: {
            filters: {
              mainCategory: selectedMainCat,
              location: selectedLocation,
              size: selectedSize,
            },
          },
        });
        break;
      case "smestaj":
        navigate("/smestaj", {
          state: {
            filters: {
              location: selectedLocation,
              minCapacity: selectedCapacity,
            },
          },
        });
        break;
      case "ketering":
        navigate("/ketering", {
          state: { filters: { location: selectedLocation } },
        });
        break;
      case "placevi":
        navigate("/placevi", {
          state: {
            filters: { location: selectedLocation, purpose: selectedPurpose },
          },
        });
        break;
      case "masine":
        navigate("/masine", {
          state: {
            filters: {
              category: selectedMachineCat,
              location: selectedLocation,
            },
          },
        });
        break;
      case "alat-i-oprema":
        navigate("/alat-i-oprema", {
          state: {
            filters: {
              category: selectedMarketCat,
              location: selectedLocation,
            },
          },
        });
        break;
    }
  };

  const handleSearch = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (globalQuery.trim()) {
      navigate(`/ai-pretraga?q=${encodeURIComponent(globalQuery)}`);
      return;
    }
    handleCategorySearch();
  };

  return {
    globalQuery,
    setGlobalQuery,
    showFilters,
    setShowFilters,
    activeTab,
    setActiveTab,
    filters: {
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
    },
    handleSearch,
    handleCategorySearch,
  };
}
