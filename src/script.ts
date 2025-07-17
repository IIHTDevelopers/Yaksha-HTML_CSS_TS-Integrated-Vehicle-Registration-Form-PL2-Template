(() => {
  type FormElements = {
    form: HTMLFormElement;
    ownerName: HTMLInputElement;
    makeModel: HTMLInputElement;
    regNumber: HTMLInputElement;
    regDate: HTMLInputElement;
    vehicleType: HTMLSelectElement;
    terms: HTMLInputElement;
    ownerNameError: HTMLElement;
    makeModelError: HTMLElement;
    vehicleTypeError: HTMLElement;
    regNumberError: HTMLElement;
    regDateError: HTMLElement;
    termsError: HTMLElement;
    outputMessage: HTMLElement;
    submitBtn: HTMLButtonElement;
  };

  type TouchedFields = {
    [key in keyof Pick<FormElements, "ownerName" | "makeModel" | "vehicleType" | "regNumber" | "regDate" | "terms">]: boolean;
  };

  function getEl<T extends HTMLElement>(id: string): T | null {
    return typeof document !== "undefined" ? document.getElementById(id) as T : null;
  }

  function createElements(): FormElements | null {
    const el = {
      form: getEl<HTMLFormElement>("registerForm"),
      ownerName: getEl<HTMLInputElement>("ownerName"),
      makeModel: getEl<HTMLInputElement>("makeModel"),
      regNumber: getEl<HTMLInputElement>("regNumber"),
      regDate: getEl<HTMLInputElement>("regDate"),
      vehicleType: getEl<HTMLSelectElement>("vehicleType"),
      terms: getEl<HTMLInputElement>("terms"),

      ownerNameError: getEl<HTMLElement>("ownerNameError"),
      makeModelError: getEl<HTMLElement>("makeModelError"),
      vehicleTypeError: getEl<HTMLElement>("vehicleTypeError"),
      regNumberError: getEl<HTMLElement>("regNumberError"),
      regDateError: getEl<HTMLElement>("regDateError"),
      termsError: getEl<HTMLElement>("termsError"),
      outputMessage: getEl<HTMLElement>("outputMessage"),
      submitBtn: getEl<HTMLButtonElement>("submitBtn")
    };

    return Object.values(el).every(Boolean) ? (el as FormElements) : null;
  }

  const touchedFields: TouchedFields = {
    ownerName: false,
    makeModel: false,
    vehicleType: false,
    regNumber: false,
    regDate: false,
    terms: false
  };

  function initApp(elements: FormElements) {
    function showFieldError(field: HTMLInputElement | HTMLSelectElement, message: string) {
      const errorEl = getEl<HTMLElement>(field.id + "Error");
      if (errorEl) {
        errorEl.textContent = message;
        field.classList.add("highlight-error");
      }
    }

    function clearFieldError(field: HTMLInputElement | HTMLSelectElement) {
      
    }

    function validateField(field: HTMLInputElement | HTMLSelectElement, message: string, force = false): boolean {
      return false;
    }

    function validateTerms(force = false): boolean {
     return false;
    }

    function showTermsError(): boolean {
      elements.termsError.textContent = "You must accept terms";
      return false;
    }

    function isFormValid(force = false): boolean {
      return false;
    }

    function updateSubmitState() {
      
    }

    function validateOnSubmit() {
     
    }

    function clearForm() {
      
    }

    function setupRealTimeValidation() {
   
    }

    setupRealTimeValidation();
    elements.submitBtn.disabled = true;

    (window as any).validateOnSubmit = validateOnSubmit;
    (window as any).clearForm = clearForm;
  }

  function initializeWhenReady() {
    if (typeof document === "undefined") return;

    const onReady = () => {
      const elements = createElements();
      if (elements) initApp(elements);
    };

    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", onReady);
    } else {
      onReady();
    }
  }

  initializeWhenReady();
})();
