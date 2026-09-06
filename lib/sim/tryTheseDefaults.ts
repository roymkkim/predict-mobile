import { setBtcLiveCarouselCard } from "./btcLiveCarouselCardStore";
import { setComboBrandStyle } from "./comboBrandStore";
import { setComboAffordance } from "./comboAffordanceStore";
import { setComboCartStyle } from "./comboCartStyleStore";
import { setComboCartDrop } from "./comboCartDropStore";
import { setComboLineSlider } from "./comboLineSliderStore";
import { setComboPageIa } from "./comboPageIaStore";
import { setComboSheetBorder } from "./comboSheetBorderStore";
import { setComboTemplates } from "./comboTemplatesStore";
import { setCombinationsEntry, setCombinationsVisible } from "./combinationsStore";
import { setShowFooter } from "./feedTopControlsStore";
import { setMarketRulesStyle } from "./marketRulesStore";
import { setOnboardingEnabled } from "./onboardingStore";
import { setOutcomeButtonColorMode } from "./outcomeButtonColorStore";
import { setSocialUx } from "./socialUxStore";
import { stopSocialTour } from "./socialTourStore";
import { setSuccessScreenStyle } from "./successScreenStore";
import { setSwipeToBuy } from "./swipeToBuyStore";
import { setTeamAbbrUnderLogos } from "./teamAbbrUnderLogosStore";
import { setTradeCardLayout } from "./tradeCardLayoutStore";

/** Persist first-visit Display / Try these values. Session-only flags are turned off. */
export function resetTryTheseDefaults(): void {
  setSocialUx(true);
  setCombinationsVisible(true);
  setCombinationsEntry("tile");
  setComboPageIa("tabs");
  setComboTemplates(true);
  setComboSheetBorder("muted");
  setComboBrandStyle("flat");
  setComboAffordance("cart");
  setComboCartStyle("fill");
  setComboCartDrop(true);
  setComboLineSlider(false);
  setBtcLiveCarouselCard("simple");
  setTeamAbbrUnderLogos(false);
  setSwipeToBuy(false);
  setSuccessScreenStyle("flat");
  setTradeCardLayout("ticket");
  setOutcomeButtonColorMode("fill");
  setMarketRulesStyle("about");
  setShowFooter(true);
  stopSocialTour();
  setOnboardingEnabled(false);
}
