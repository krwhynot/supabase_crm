<template>
  <div class="product-form-wrapper">
    <!-- Form Progress Indicator -->
    <div class="mb-8">
      <div class="flex items-center justify-between">
        <div class="flex items-center space-x-4">
          <h2 class="text-xl font-semibold text-gray-900 header-sparkle">
            <span class="inline-flex items-center">
              {{ isEditing ? 'Edit Product' : 'Create New Product' }}
              <svg v-if="!isEditing" class="ml-2 h-5 w-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
              </svg>
              <svg v-else class="ml-2 h-5 w-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
              </svg>
            </span>
          </h2>
          <div v-if="!isEditing" class="text-sm text-gray-500 step-counter">
            <span class="font-medium">Step {{ currentStep }}</span> 
            <span class="text-gray-400 mx-1">of</span> 
            <span class="font-medium">{{ totalSteps }}</span>
            <svg v-if="currentStep === totalSteps" class="ml-2 h-4 w-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
          </div>
        </div>
        
        <!-- Form Status Indicator -->
        <Transition
          enter-active-class="transition-all duration-500 ease-out"
          enter-from-class="opacity-0 scale-75 translate-x-8 rotate-12"
          enter-to-class="opacity-100 scale-100 translate-x-0 rotate-0"
          leave-active-class="transition-all duration-300 ease-in"
          leave-from-class="opacity-100 scale-100 translate-x-0 rotate-0"
          leave-to-class="opacity-0 scale-75 translate-x-8 rotate-12"
        >
          <div v-if="formStatus !== ProductFormSubmissionState.IDLE" 
               class="flex items-center space-x-2 px-5 py-3 rounded-full text-sm font-medium shadow-lg status-indicator hover:scale-105 transition-transform duration-200"
               :class="getStatusClasses()">
            <div v-if="formStatus === ProductFormSubmissionState.SUBMITTING" 
                 class="relative">
              <div class="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full celebration-spin"></div>
              <div class="absolute inset-0 animate-ping h-4 w-4 border-2 border-current rounded-full opacity-30"></div>
            </div>
            <CheckIcon v-else-if="formStatus === ProductFormSubmissionState.SUCCESS" 
                      class="h-4 w-4 text-white" />
            <ExclamationTriangleIcon v-else-if="formStatus === ProductFormSubmissionState.ERROR" 
                                   class="h-4 w-4 text-red-500" />
            <ClockIcon v-else-if="formStatus === ProductFormSubmissionState.DRAFT_SAVING" 
                      class="h-4 w-4 text-blue-500" />
            <span class="status-text font-medium">{{ getStatusText() }}</span>
          </div>
        </Transition>
      </div>
      
      <!-- Progress Bar (only for creation) -->
      <div v-if="!isEditing" class="mt-4">
        <div class="flex items-center">
          <div
            v-for="step in totalSteps"
            :key="step"
            class="flex items-center step-container"
          >
            <!-- Step Circle -->
            <div
              :class="[
                'step-circle relative flex items-center justify-center w-10 h-10 rounded-full border-2 text-sm font-medium transition-all duration-500 ease-out cursor-pointer hover:shadow-xl group',
                step < currentStep 
                  ? 'bg-gradient-to-br from-primary-500 via-primary-600 to-primary-700 border-primary-600 text-white scale-100 shadow-lg step-completed hover:scale-110 hover:rotate-3 hover:shadow-xl' 
                  : step === currentStep
                    ? 'bg-white border-primary-600 text-primary-600 scale-110 shadow-lg ring-2 ring-primary-200 step-active hover:ring-primary-300'
                    : 'bg-white border-gray-300 text-gray-400 scale-95 step-pending hover:border-primary-400 hover:text-primary-500 hover:scale-105 hover:shadow-md'
              ]"
              @click="step <= currentStep ? goToStep(step) : null"
              @mouseenter="handleStepHover(step)"
            >
              <Transition
                enter-active-class="transition-all duration-600 ease-out"
                enter-from-class="scale-0 rotate-360 opacity-0"
                enter-to-class="scale-100 rotate-0 opacity-100"
                leave-active-class="transition-all duration-300 ease-in"
                leave-from-class="scale-100 rotate-0 opacity-100"
                leave-to-class="scale-0 rotate-360 opacity-0"
              >
                <CheckIcon v-if="step < currentStep" class="w-5 h-5 text-white drop-shadow-sm" />
                <span v-else class="transition-all duration-300 step-number" :class="{ 
                  'scale-110 font-bold text-primary-700': step === currentStep,
                  'group-hover:scale-105 group-hover:font-semibold transition-all duration-200': step > currentStep 
                }">{{ step }}</span>
              </Transition>
              
              <!-- Professional completion indicator -->
              <div v-if="step < currentStep" class="absolute inset-0 ring-2 ring-green-200 ring-opacity-50 rounded-full"></div>
            </div>
            
            <!-- Step Connector -->
            <div
              v-if="step < totalSteps"
              class="step-connector relative w-20 h-1 mx-3 bg-gray-200 overflow-hidden rounded-full shadow-inner"
            >
              <div
                class="absolute top-0 left-0 h-full bg-gradient-to-r from-primary-500 to-primary-600 rounded-full transition-all duration-700 ease-out shadow-sm"
                :style="{ width: step < currentStep ? '100%' : '0%' }"
              ></div>
              <!-- Shimmer effect on progress -->
              <div
                v-if="step < currentStep"
                class="absolute top-0 left-0 h-full w-full bg-gradient-to-r from-transparent via-white to-transparent opacity-20"
              ></div>
            </div>
          </div>
        </div>
        
        <!-- Step Labels -->
        <div class="flex mt-3">
          <div
            v-for="(stepInfo, index) in stepLabels"
            :key="index"
            class="flex-1 text-center step-label-container"
          >
            <div
              class="text-xs font-medium transition-all duration-300 ease-in-out"
              :class="[
                (index + 1) < currentStep 
                  ? 'text-primary-600 transform scale-105' 
                  : (index + 1) === currentStep
                    ? 'text-primary-700 font-bold transform scale-105'
                    : 'text-gray-400 transform scale-95'
              ]"
            >
              {{ stepInfo.label }}
              <span v-if="(index + 1) < currentStep" class="ml-1 text-green-500">✓</span>
            </div>
            <div
              v-if="stepInfo.description"
              class="text-xs mt-1 transition-all duration-300 ease-in-out"
              :class="[
                (index + 1) < currentStep 
                  ? 'text-gray-600 opacity-100' 
                  : (index + 1) === currentStep
                    ? 'text-gray-700 opacity-100 font-medium'
                    : 'text-gray-400 opacity-80'
              ]"
            >
              {{ stepInfo.description }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Form Content -->
    <form @submit.prevent="handleSubmit" class="space-y-8">
      <!-- Step 1: Basic Information -->
      <Transition
        enter-active-class="transition-all duration-500 ease-out"
        enter-from-class="opacity-0 transform translate-x-8 scale-95"
        enter-to-class="opacity-100 transform translate-x-0 scale-100"
        leave-active-class="transition-all duration-300 ease-in"
        leave-from-class="opacity-100 transform translate-x-0 scale-100"
        leave-to-class="opacity-0 transform -translate-x-8 scale-95"
      >
        <div v-if="currentStep === 1 || isEditing" class="step-section step-animation">
          <div class="bg-white rounded-lg border border-gray-200 shadow-sm p-6 step-card">
            <h3 class="text-lg font-medium text-gray-900 mb-6">
              <span class="flex items-center space-x-2">
                <span class="w-2 h-2 bg-primary-500 rounded-full"></span>
                <span>Basic Information</span>
              </span>
            </h3>
            
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <!-- Product Name -->
              <div class="lg:col-span-2">
                <div class="form-field">
                  <label for="product-name" class="block text-sm font-medium text-gray-700 mb-1">
                    Product Name <span class="text-red-500">*</span>
                  </label>
                  <input
                    id="product-name"
                    v-model="formData.name"
                    type="text"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    :class="{ 'border-red-500': validationErrors.name }"
                    placeholder="Enter product name"
                  />
                  <p v-if="validationErrors.name" class="mt-1 text-sm text-red-600">{{ validationErrors.name }}</p>
                  <p class="mt-1 text-xs text-gray-500">Enter a unique and descriptive name for your product</p>
                </div>
            </div>

            <!-- Category Selection -->
            <div>
              <CategorySelect
                name="category"
                label="Category"
                v-model="formData.category"
                :error="validationErrors.category"
                :required="true"
                :show-icons="true"
                @category-changed="handleCategoryChanged"
              />
            </div>

            <!-- SKU Field -->
            <div>
              <SkuField
                name="sku"
                label="SKU / Product Code"
                v-model="formData.sku"
                v-model:auto-generate="formData.autoGenerateSku"
                :product-name="formData.name"
                :category="formData.category"
                :error="validationErrors.sku"
                :required="!formData.autoGenerateSku"
                @sku-generated="handleSkuGenerated"
              />
            </div>

            <!-- Product Description -->
            <div class="lg:col-span-2">
              <label for="description" class="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                id="description"
                v-model="formData.description"
                rows="4"
                placeholder="Provide a detailed description of the product, its features, and benefits..."
                :class="textareaClasses"
                :aria-invalid="!!validationErrors.description"
                :aria-describedby="validationErrors.description ? 'description-error' : undefined"
              />
              <p
                v-if="validationErrors.description"
                id="description-error"
                class="mt-1 text-sm text-red-600"
              >
                {{ validationErrors.description }}
              </p>
            </div>

            <!-- Active Status -->
            <div class="lg:col-span-2">
              <div class="flex items-center space-x-3">
                <input
                  id="is-active"
                  type="checkbox"
                  v-model="formData.isActive"
                  class="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label for="is-active" class="text-sm font-medium text-gray-700">
                  Active Product
                </label>
              </div>
              <p class="mt-1 text-sm text-gray-500">
                Active products are available for selection in opportunities and orders
              </p>
            </div>
          </div>
        </div>
      </Transition>

      <!-- Step 2: Product Details & Pricing -->
      <Transition
        enter-active-class="transition-all duration-500 ease-out"
        enter-from-class="opacity-0 transform translate-x-8 scale-95"
        enter-to-class="opacity-100 transform translate-x-0 scale-100"
        leave-active-class="transition-all duration-300 ease-in"
        leave-from-class="opacity-100 transform translate-x-0 scale-100"
        leave-to-class="opacity-0 transform -translate-x-8 scale-95"
      >
        <div v-if="currentStep === 2 || isEditing" class="step-section step-animation">
          <div class="bg-white rounded-lg border border-gray-200 shadow-sm p-6 step-card">
            <h3 class="text-lg font-medium text-gray-900 mb-6">
              <span class="flex items-center space-x-2">
                <span class="w-2 h-2 bg-primary-500 rounded-full"></span>
                <span>Product Details & Pricing</span>
              </span>
            </h3>
          
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <!-- Pricing Section -->
            <div class="lg:col-span-2">
              <PricingFields
                v-model:unit-price="formData.unitPrice"
                v-model:cost-price="formData.costPrice"
                v-model:currency="formData.currency"
                :unit-price-error="validationErrors.unitPrice"
                :cost-price-error="validationErrors.costPrice"
                :currency-error="validationErrors.currency"
              />
            </div>

            <!-- Unit of Measure -->
            <div>
              <label for="unit-of-measure" class="block text-sm font-medium text-gray-700 mb-1">
                Unit of Measure
                <span class="text-red-500 ml-1">*</span>
              </label>
              <select
                id="unit-of-measure"
                v-model="formData.unitOfMeasure"
                :class="selectClasses"
                :aria-invalid="!!validationErrors.unitOfMeasure"
                :aria-describedby="validationErrors.unitOfMeasure ? 'unit-error' : undefined"
              >
                <option value="">Select unit...</option>
                <option v-for="unit in availableUnits" :key="unit" :value="unit">
                  {{ unit }}
                </option>
              </select>
              <p
                v-if="validationErrors.unitOfMeasure"
                id="unit-error"
                class="mt-1 text-sm text-red-600"
              >
                {{ validationErrors.unitOfMeasure }}
              </p>
            </div>

            <!-- Minimum Order Quantity -->
            <div>
              <label for="min-order-qty" class="block text-sm font-medium text-gray-700 mb-1">
                Minimum Order Quantity
              </label>
              <input
                id="min-order-qty"
                v-model.number="formData.minimumOrderQuantity"
                type="number"
                min="1"
                step="1"
                placeholder="1"
                :class="inputClasses"
              />
            </div>

            <!-- Lead Time -->
            <div>
              <label for="lead-time" class="block text-sm font-medium text-gray-700 mb-1">
                Lead Time (Days)
              </label>
              <input
                id="lead-time"
                v-model.number="formData.leadTimeDays"
                type="number"
                min="0"
                max="365"
                step="1"
                placeholder="0"
                :class="inputClasses"
              />
            </div>

            <!-- Specifications Editor -->
            <div class="lg:col-span-2">
              <SpecificationsEditor
                v-model="formData.specifications"
                :category="formData.category"
                :error="validationErrors.specifications"
                label="Product Specifications"
                description="Add key specifications and attributes for this product"
              />
            </div>
          </div>
          </div>
        </div>
      </Transition>

      <!-- Step 3: Principal Assignment -->
      <Transition
        enter-active-class="transition-all duration-500 ease-out"
        enter-from-class="opacity-0 transform translate-x-8 scale-95"
        enter-to-class="opacity-100 transform translate-x-0 scale-100"
        leave-active-class="transition-all duration-300 ease-in"
        leave-from-class="opacity-100 transform translate-x-0 scale-100"
        leave-to-class="opacity-0 transform -translate-x-8 scale-95"
      >
        <div v-if="currentStep === 3 || isEditing" class="step-section step-animation">
          <div class="bg-white rounded-lg border border-gray-200 shadow-sm p-6 step-card">
          <h3 class="text-lg font-medium text-gray-900 mb-6">
            <span class="flex items-center space-x-2">
              <span class="w-2 h-2 bg-primary-500 rounded-full"></span>
              <span>Principal Assignment</span>
            </span>
          </h3>
          
          <div class="space-y-6">
            <!-- Principal Multi-Select -->
            <PrincipalMultiSelect
              name="principals"
              label="Assign Principals"
              v-model="formData.selectedPrincipals"
              :principal-required="formData.principalRequired"
              :error="validationErrors.selectedPrincipals"
              :required="formData.principalRequired"
              :show-assignment-preview="true"
              :bulk-assign-mode="formData.bulkAssignMode"
              description="Select which principals can access and order this product"
              @selection-changed="handlePrincipalSelectionChanged"
              @bulk-assign-toggled="handleBulkAssignToggled"
            />

            <!-- Assignment Options -->
            <div class="bg-gray-50 rounded-lg p-4">
              <h4 class="text-sm font-medium text-gray-900 mb-3">Assignment Options</h4>
              <div class="space-y-3">
                <div class="flex items-center space-x-3">
                  <input
                    id="principal-required"
                    type="checkbox"
                    v-model="formData.principalRequired"
                    class="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <label for="principal-required" class="text-sm text-gray-700">
                    Require principal assignment (at least one principal must be assigned)
                  </label>
                </div>
                
                <div class="flex items-center space-x-3">
                  <input
                    id="bulk-assign"
                    type="checkbox"
                    v-model="formData.bulkAssignMode"
                    class="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <label for="bulk-assign" class="text-sm text-gray-700">
                    Enable bulk assignment tools for easier multi-principal selection
                  </label>
                </div>
              </div>
            </div>
          </div>
          </div>
        </div>
      </Transition>

      <!-- Step 4: Review & Confirmation -->
      <Transition
        enter-active-class="transition-all duration-500 ease-out"
        enter-from-class="opacity-0 transform translate-x-8 scale-95"
        enter-to-class="opacity-100 transform translate-x-0 scale-100"
        leave-active-class="transition-all duration-300 ease-in"
        leave-from-class="opacity-100 transform translate-x-0 scale-100"
        leave-to-class="opacity-0 transform -translate-x-8 scale-95"
      >
        <div v-if="currentStep === 4 || isEditing" class="step-section step-animation">
          <div class="bg-white rounded-lg border border-gray-200 shadow-sm p-6 step-card">
          <h3 class="text-lg font-medium text-gray-900 mb-6">
            <span class="flex items-center space-x-2">
              <span class="w-2 h-2 bg-primary-500 rounded-full"></span>
              <span>Review & Confirmation</span>
            </span>
          </h3>
          
          <!-- Form Summary -->
          <ProductFormSummary
            :form-data="formData"
            :principal-names="selectedPrincipalNames as any"
            @edit-step="goToStep"
            class="mb-6"
          />

          <!-- Terms and Notifications -->
          <div class="space-y-6">
            <!-- Terms Acceptance -->
            <div class="border-t border-gray-200 pt-6">
              <div class="flex items-start space-x-3">
                <input
                  id="terms-accepted"
                  type="checkbox"
                  v-model="formData.termsAccepted"
                  :class="[
                    'mt-1 h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded',
                    validationErrors.termsAccepted ? 'border-red-500' : ''
                  ]"
                  :aria-invalid="!!validationErrors.termsAccepted"
                />
                <label for="terms-accepted" class="text-sm text-gray-700">
                  I accept the <button type="button" class="text-primary-600 hover:text-primary-500 underline">terms and conditions</button> 
                  for product creation and understand that this product will be made available to the selected principals.
                </label>
              </div>
              <p
                v-if="validationErrors.termsAccepted"
                class="mt-1 text-sm text-red-600"
              >
                {{ validationErrors.termsAccepted }}
              </p>
            </div>

            <!-- Notification Emails (Optional) -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                Notification Emails (Optional)
              </label>
              <NotificationEmailsField
                v-model="formData.notificationEmails"
                :error="validationErrors.notificationEmails"
                description="Enter email addresses to notify when the product is created"
                placeholder="Enter email address..."
              />
            </div>
          </div>
          </div>
        </div>
      </Transition>

      <!-- Error Summary -->
      <div v-if="submitError" class="bg-red-50 border border-red-200 rounded-md p-4">
        <div class="flex">
          <ExclamationTriangleIcon class="h-5 w-5 text-red-400 mr-3 mt-0.5 flex-shrink-0" />
          <div>
            <h3 class="text-sm font-medium text-red-800">Error submitting form</h3>
            <p class="mt-1 text-sm text-red-700">{{ submitError }}</p>
          </div>
        </div>
      </div>

      <!-- Form Actions -->
      <div class="bg-gray-50 rounded-lg p-6">
        <div class="flex items-center justify-between">
          <!-- Left Side Actions -->
          <div class="flex items-center space-x-3">
            <button
              v-if="!isEditing && currentStep > 1"
              type="button"
              @click="previousStep"
              class="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              <ArrowLeftIcon class="-ml-1 mr-2 h-4 w-4" />
              Previous
            </button>
            
            <button
              type="button"
              @click="handleCancel"
              class="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              Cancel
            </button>
          </div>

          <!-- Right Side Actions -->
          <div class="flex items-center space-x-3">
            <!-- Save Draft (creation only) -->
            <button
              v-if="!isEditing"
              type="button"
              @click="saveDraft"
              :disabled="isSaving || formStatus === ProductFormSubmissionState.DRAFT_SAVING"
              class="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
            >
              <ClockIcon class="-ml-1 mr-2 h-4 w-4" />
              {{ formStatus === ProductFormSubmissionState.DRAFT_SAVING ? 'Saving...' : 'Save Draft' }}
            </button>

            <!-- Next/Submit Button -->
            <button
              v-if="!isEditing && currentStep < totalSteps"
              type="button"
              @click="nextStep"
              :disabled="!canProceedToNext"
              class="next-button group relative inline-flex items-center px-8 py-3 border border-transparent rounded-lg shadow-lg text-sm font-semibold text-white bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 ease-out hover:scale-105 hover:shadow-xl transform-gpu"
            >
              <span class="relative z-10 flex items-center">
                <span class="mr-2">Next Step</span>
                <ArrowRightIcon class="h-4 w-4 transition-transform duration-300 group-hover:translate-x-2 group-hover:scale-110" />
              </span>
              <!-- Button glow effect -->
              <div class="absolute inset-0 rounded-lg bg-gradient-to-r from-primary-400 to-primary-500 opacity-0 group-hover:opacity-50 transition-opacity duration-300 blur-sm"></div>
            </button>

            <button
              v-else
              type="submit"
              :disabled="isSubmitting || !isFormValid"
              class="submit-button group relative inline-flex items-center px-8 py-3 border border-transparent rounded-lg shadow-lg text-sm font-semibold text-white bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 ease-out hover:scale-105 hover:shadow-xl transform-gpu"
            >
              <Transition
                enter-active-class="transition-all duration-300 ease-out"
                enter-from-class="scale-0 rotate-180 opacity-0"
                enter-to-class="scale-100 rotate-0 opacity-100"
                leave-active-class="transition-all duration-200 ease-in"
                leave-from-class="scale-100 rotate-0 opacity-100"
                leave-to-class="scale-0 rotate-180 opacity-0"
              >
                <div v-if="isSubmitting" class="relative mr-3">
                  <div class="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                  <div class="absolute inset-0 animate-ping h-4 w-4 border-2 border-white rounded-full opacity-20"></div>
                </div>
              </Transition>
              <span class="relative z-10 flex items-center">
                <span>{{ isSubmitting ? 'Creating Product...' : isEditing ? 'Update Product' : getSubmitButtonText() }}</span>
                <svg v-if="!isSubmitting && !isEditing" class="ml-2 h-4 w-4 text-white transition-transform duration-200 group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
                </svg>
                <svg v-if="!isSubmitting && isEditing" class="ml-2 h-4 w-4 text-white transition-transform duration-200 group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                </svg>
                <div v-if="isSubmitting" class="ml-2 flex items-center">
                  <svg class="h-4 w-4 text-white animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </div>
              </span>
              <!-- Success celebration overlay -->
              <div v-if="formStatus === ProductFormSubmissionState.SUCCESS" 
                   class="absolute inset-0 rounded-lg bg-gradient-to-r from-green-400 to-emerald-400 animate-pulse opacity-75"></div>
              <!-- Button glow effect -->
              <div class="absolute inset-0 rounded-lg bg-gradient-to-r from-green-400 to-emerald-400 opacity-0 group-hover:opacity-30 transition-opacity duration-300 blur-sm"></div>
            </button>
          </div>
        </div>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted, nextTick } from 'vue'
import { 
  CheckIcon, 
  ExclamationTriangleIcon, 
  ClockIcon, 
  ArrowLeftIcon, 
  ArrowRightIcon 
} from '@heroicons/vue/24/outline'
import { useProductStore } from '@/stores/productStore'
import { usePrincipalStore } from '@/stores/principalStore'
// import ProductNameField from './ProductNameField.vue' // Temporarily disabled
import CategorySelect from './CategorySelect.vue'
import SkuField from './SkuField.vue'
import PricingFields from './PricingFields.vue'
import SpecificationsEditor from './SpecificationsEditor.vue'
import PrincipalMultiSelect from './PrincipalMultiSelect.vue'
import ProductFormSummary from './ProductFormSummary.vue'
import NotificationEmailsField from './NotificationEmailsField.vue'
import { 
  ProductFormWrapperData, 
  ProductFormValidationErrors, 
  ProductFormSubmissionState,
  UnitOfMeasure,
  CATEGORY_VALIDATION_RULES,
  DEFAULT_PRODUCT_FORM_DATA
} from '@/types/productForm'
import { 
  productFormStep1ValidationSchema,
  productFormStep2ValidationSchema,
  productFormStep3ValidationSchema,
  productFormStep4ValidationSchema,
  productFormCompleteValidationSchema
} from '@/types/productForm'
import { ProductCategory } from '@/types/products'

/**
 * Props interface for ProductFormWrapper
 */
interface Props {
  /** Whether this is an edit form */
  isEditing?: boolean
  /** Initial data for editing or context from other pages */
  initialData?: Partial<ProductFormWrapperData & { productId?: string }>
  /** Auto-save interval in milliseconds */
  autoSaveInterval?: number
}

const props = withDefaults(defineProps<Props>(), {
  isEditing: false,
  autoSaveInterval: 30000 // 30 seconds
})

/**
 * Component emits
 */
interface Emits {
  /** Emitted when form is successfully submitted */
  success: [data: { productId?: string; productName?: string; assignedPrincipals?: number }]
  /** Emitted when form is cancelled */
  cancel: []
  /** Emitted when form submission error occurs */
  error: [error: string | Error]
  /** Emitted when draft is saved */
  draftSaved: [formData: ProductFormWrapperData]
  /** Emitted when form data changes */
  dataChanged: [formData: ProductFormWrapperData]
}

const emit = defineEmits<Emits>()

// Dependencies
const productStore = useProductStore()
const principalStore = usePrincipalStore()

// Note: ProductFormSubmissionState is imported from types

// ===============================
// FORM STATE MANAGEMENT
// ===============================

const currentStep = ref(1)
const totalSteps = 4
const isSubmitting = ref(false)
const isSaving = ref(false)
const submitError = ref<string | null>(null)
const formStatus = ref<string>(ProductFormSubmissionState.IDLE)

const stepLabels = [
  { label: 'Basic Info', description: 'Name & Category', key: 'basic' },
  { label: 'Details', description: 'Pricing & Specs', key: 'details' },
  { label: 'Principals', description: 'Access Assignment', key: 'principals' },
  { label: 'Review', description: 'Final Confirmation', key: 'review' }
]

// Form data reactive object
const formData = reactive<ProductFormWrapperData>({
  ...DEFAULT_PRODUCT_FORM_DATA
})

// Validation errors
const validationErrors = ref<ProductFormValidationErrors>({})

// ===============================
// COMPUTED PROPERTIES
// ===============================

const inputClasses = computed(() => 
  'w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors duration-200'
)

const selectClasses = computed(() => 
  'w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors duration-200'
)

const textareaClasses = computed(() => 
  'w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors duration-200 resize-vertical'
)

const availableUnits = computed(() => {
  if (!formData.category) return Object.values(UnitOfMeasure)
  
  const categoryRules = CATEGORY_VALIDATION_RULES[formData.category]
  return categoryRules?.unitOfMeasure || Object.values(UnitOfMeasure)
})

const selectedPrincipalNames = computed(() => {
  return formData.selectedPrincipals.map(id => {
    const principal = principalStore.getPrincipalById(id)
    return principal?.name || id
  })
})

const canProceedToNext = computed(() => {
  switch (currentStep.value) {
    case 1:
      return !!(formData.name && formData.category && (!formData.autoGenerateSku ? formData.sku : true))
    case 2:
      return !!(formData.unitOfMeasure)
    case 3:
      return !formData.principalRequired || formData.selectedPrincipals.length > 0
    case 4:
      return formData.termsAccepted
    default:
      return false
  }
})

const isFormValid = computed(() => {
  return !!(
    formData.name &&
    formData.category &&
    formData.unitOfMeasure &&
    (!formData.principalRequired || formData.selectedPrincipals.length > 0) &&
    formData.termsAccepted
  )
})

const getSubmitButtonText = () => {
  return 'Create Product'
}

const getStatusClasses = () => {
  switch (formStatus.value) {
    case ProductFormSubmissionState.SUBMITTING:
    case ProductFormSubmissionState.DRAFT_SAVING:
      return 'bg-blue-50 text-blue-700'
    case ProductFormSubmissionState.SUCCESS:
    case ProductFormSubmissionState.DRAFT_SAVED:
      return 'bg-green-50 text-green-700'
    case ProductFormSubmissionState.ERROR:
      return 'bg-red-50 text-red-700'
    default:
      return 'bg-gray-50 text-gray-700'
  }
}

const getStatusText = () => {
  switch (formStatus.value) {
    case ProductFormSubmissionState.SUBMITTING:
      return 'Creating Product...'
    case ProductFormSubmissionState.DRAFT_SAVING:
      return 'Saving Draft...'
    case ProductFormSubmissionState.DRAFT_SAVED:
      return 'Draft Saved'
    case ProductFormSubmissionState.SUCCESS:
      return 'Product Created'
    case ProductFormSubmissionState.ERROR:
      return 'Error Occurred'
    default:
      return ''
  }
}

// ===============================
// UTILITY FUNCTIONS
// ===============================

/**
 * Transform wrapper form data to API form data format
 */
const transformToApiFormat = (): any => {
  return {
    name: formData.name,
    description: formData.description || null,
    category: formData.category,
    sku: formData.sku || null,
    unit_price: formData.unitPrice || null,
    is_active: formData.isActive,
    // Additional fields would be mapped here
    specifications: formData.specifications,
    principal_ids: formData.selectedPrincipals,
    minimum_order_quantity: formData.minimumOrderQuantity,
    lead_time_days: formData.leadTimeDays,
    currency: formData.currency,
    unit_of_measure: formData.unitOfMeasure,
    cost_price: formData.costPrice
  }
}

// ===============================
// FORM VALIDATION
// ===============================

const validateCurrentStep = (): boolean => {
  const errors: ProductFormValidationErrors = {}
  
  try {
    switch (currentStep.value) {
      case 1:
        productFormStep1ValidationSchema.validateSync({
          name: formData.name,
          category: formData.category,
          description: formData.description,
          sku: formData.sku,
          autoGenerateSku: formData.autoGenerateSku,
          isActive: formData.isActive
        }, { abortEarly: false })
        break
      case 2:
        productFormStep2ValidationSchema.validateSync({
          unitPrice: formData.unitPrice,
          costPrice: formData.costPrice,
          currency: formData.currency,
          unitOfMeasure: formData.unitOfMeasure,
          minimumOrderQuantity: formData.minimumOrderQuantity,
          leadTimeDays: formData.leadTimeDays,
          specifications: formData.specifications
        }, { abortEarly: false })
        break
      case 3:
        productFormStep3ValidationSchema.validateSync({
          selectedPrincipals: formData.selectedPrincipals,
          principalRequired: formData.principalRequired,
          bulkAssignMode: formData.bulkAssignMode
        }, { abortEarly: false })
        break
      case 4:
        productFormStep4ValidationSchema.validateSync({
          termsAccepted: formData.termsAccepted,
          notificationEmails: formData.notificationEmails,
          saveAsDraft: formData.saveAsDraft
        }, { abortEarly: false })
        break
    }
  } catch (validationError: any) {
    if (validationError.inner) {
      validationError.inner.forEach((err: any) => {
        errors[err.path as keyof ProductFormValidationErrors] = err.message
      })
    } else {
      errors.name = 'Validation error occurred'
    }
  }
  
  validationErrors.value = errors
  return Object.keys(errors).length === 0
}

const validateForm = (): boolean => {
  try {
    productFormCompleteValidationSchema.validateSync(formData, { abortEarly: false })
    validationErrors.value = {}
    return true
  } catch (validationError: any) {
    const errors: ProductFormValidationErrors = {}
    if (validationError.inner) {
      validationError.inner.forEach((err: any) => {
        errors[err.path as keyof ProductFormValidationErrors] = err.message
      })
    }
    validationErrors.value = errors
    return false
  }
}

// ===============================
// STEP NAVIGATION
// ===============================

const nextStep = async () => {
  if (validateCurrentStep() && currentStep.value < totalSteps) {
    // Professional step completion with subtle feedback
    const currentStepElement = document.querySelector(`.step-circle:nth-child(${currentStep.value * 2 - 1})`)
    if (currentStepElement) {
      // Subtle completion transition
      currentStepElement.classList.add('step-completing')
      
      // Brief professional feedback
      showFloatingMessage(`Step ${currentStep.value} completed`, 'success')
      
      // Cleanup animation classes
      setTimeout(() => {
        currentStepElement.classList.remove('step-completing')
      }, 300)
    }
    
    // Brief transition delay for smooth UX
    await new Promise(resolve => setTimeout(resolve, 150))
    
    currentStep.value++
    
    // Subtle entrance for new step
    nextTick(() => {
      const newStepElement = document.querySelector(`.step-circle:nth-child(${currentStep.value * 2 - 1})`)
      if (newStepElement) {
        newStepElement.classList.add('step-entering')
        
        setTimeout(() => {
          newStepElement.classList.remove('step-entering')
        }, 300)
      }
    })
  }
}

const previousStep = () => {
  if (currentStep.value > 1) {
    currentStep.value--
  }
}

const goToStep = (step: number) => {
  if (step >= 1 && step <= totalSteps) {
    currentStep.value = step
  }
}

// ===============================
// DELIGHT & INTERACTION HELPERS
// ===============================

/**
 * Play a subtle success sound for step completion
 */
// Sound function removed for professional enterprise environment

/**
 * Play hover sound for interactive buttons
 */
// Sound function removed for professional enterprise environment

/**
 * Show floating success/info messages
 */
const showFloatingMessage = (message: string, type: 'success' | 'info' | 'warning' = 'info') => {
  const messageElement = document.createElement('div')
  messageElement.textContent = message
  messageElement.className = `
    fixed top-4 right-4 z-50 px-4 py-2 rounded-lg shadow-lg font-medium text-sm
    transform transition-all duration-500 ease-out
    ${type === 'success' ? 'bg-green-100 text-green-800 border border-green-200' : 
      type === 'warning' ? 'bg-yellow-100 text-yellow-800 border border-yellow-200' :
      'bg-blue-100 text-blue-800 border border-blue-200'}
  `
  
  // Initial state (hidden)
  messageElement.style.transform = 'translateX(100%) scale(0.8)'
  messageElement.style.opacity = '0'
  
  document.body.appendChild(messageElement)
  
  // Animate in
  requestAnimationFrame(() => {
    messageElement.style.transform = 'translateX(0) scale(1)'
    messageElement.style.opacity = '1'
  })
  
  // Animate out and remove
  setTimeout(() => {
    messageElement.style.transform = 'translateX(100%) scale(0.8)'
    messageElement.style.opacity = '0'
    
    setTimeout(() => {
      document.body.removeChild(messageElement)
    }, 500)
  }, 2500)
}

/**
 * Handle step hover with preview tooltip
 */
const handleStepHover = (step: number) => {
  if (step <= currentStep.value) {
    const stepInfo = stepLabels[step - 1]
    showFloatingMessage(`${stepInfo.label}: ${stepInfo.description}`, 'info')
  }
}

/**
 * Create celebration confetti burst
 */
// Confetti function removed for professional enterprise environment

// ===============================
// EVENT HANDLERS
// ===============================

const handleCategoryChanged = (category: ProductCategory | null) => {
  if (!category) return
  
  console.log('Category changed:', category)
  
  // Update available units based on category
  const categoryRules = CATEGORY_VALIDATION_RULES[category]
  if (categoryRules?.unitOfMeasure && !categoryRules.unitOfMeasure.includes(formData.unitOfMeasure as any)) {
    formData.unitOfMeasure = categoryRules.unitOfMeasure[0] || UnitOfMeasure.EACH
  }
  
  // Add required specifications for this category
  if (categoryRules?.requiredSpecs) {
    const existingKeys = formData.specifications.map(spec => spec.key)
    categoryRules.requiredSpecs.forEach((specKey: string) => {
      if (!existingKeys.includes(specKey)) {
        formData.specifications.push({
          id: `spec-${Date.now()}-${Math.random()}`,
          key: specKey,
          value: '',
          isRequired: true
        })
      }
    })
  }
}

const handleSkuGenerated = (sku: string) => {
  console.log('SKU generated:', sku)
}

const handlePrincipalSelectionChanged = (selectedIds: string[], selectedPrincipals: any[]) => {
  console.log('Principal selection changed:', selectedIds, selectedPrincipals)
}

const handleBulkAssignToggled = (enabled: boolean) => {
  console.log('Bulk assign toggled:', enabled)
}

const handleSubmit = async () => {
  if (!validateForm()) {
    showFloatingMessage('Please complete all required fields', 'warning')
    return
  }
  
  isSubmitting.value = true
  submitError.value = null
  formStatus.value = ProductFormSubmissionState.SUBMITTING
  
  // Show encouraging message during submission
  showFloatingMessage('Creating your product...', 'info')
  
  try {
    const apiData = transformToApiFormat()
    let success: boolean
    let productId: string | undefined
    
    if (props.isEditing) {
      // For editing, we need the product ID from the initial data
      const editProductId = props.initialData?.productId || productStore.selectedProduct?.id
      if (!editProductId) {
        throw new Error('Product ID is required for editing')
      }
      
      success = await productStore.updateProduct(editProductId, apiData)
      productId = editProductId
    } else {
      // For creating
      success = await productStore.createProduct(apiData)
      productId = productStore.selectedProduct?.id || 'created-product-id'
    }
    
    if (success) {
      formStatus.value = ProductFormSubmissionState.SUCCESS
      
      // Celebration sequence
      setTimeout(() => {
        // Professional success feedback - visual only
        
        // Professional visual feedback only (no sound effects)
        
        // Show success message
        const productName = formData.name
        const assignedCount = formData.selectedPrincipals.length
        const successMessage = props.isEditing 
          ? `${productName} updated successfully`
          : `${productName} created with ${assignedCount} principal${assignedCount !== 1 ? 's' : ''} assigned`
        
        showFloatingMessage(successMessage, 'success')
      }, 500)
      
      const assignedPrincipals = formData.selectedPrincipals.length
      
      emit('success', { 
        productId, 
        productName: formData.name,
        assignedPrincipals
      })
    } else {
      const error = productStore.error || (props.isEditing ? 'Failed to update product' : 'Failed to create product')
      formStatus.value = ProductFormSubmissionState.ERROR
      submitError.value = error
      showFloatingMessage('Update failed. Please try again.', 'warning')
      emit('error', error)
    }
  } catch (error) {
    console.error('Form submission error:', error)
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred'
    formStatus.value = ProductFormSubmissionState.ERROR
    submitError.value = errorMessage
    showFloatingMessage('Error occurred. Please check your connection.', 'warning')
    emit('error', errorMessage)
  } finally {
    isSubmitting.value = false
  }
}

const handleCancel = () => {
  emit('cancel')
}

const saveDraft = async () => {
  isSaving.value = true
  formStatus.value = ProductFormSubmissionState.DRAFT_SAVING
  
  try {
    // Here you would implement draft saving logic
    await new Promise(resolve => setTimeout(resolve, 500)) // Simulate API call
    
    emit('draftSaved', { ...formData })
    formStatus.value = ProductFormSubmissionState.DRAFT_SAVED
    
    // Reset status after delay
    setTimeout(() => {
      formStatus.value = ProductFormSubmissionState.IDLE
    }, 2000)
  } catch (error) {
    console.error('Draft save error:', error)
    formStatus.value = ProductFormSubmissionState.ERROR
  } finally {
    isSaving.value = false
  }
}

// ===============================
// LIFECYCLE & INITIALIZATION
// ===============================

const initializeForm = () => {
  if (props.initialData) {
    // Merge initial data with form data, preserving existing values
    Object.assign(formData, props.initialData)
  }
  
  if (props.isEditing) {
    // For editing, show all steps at once
    currentStep.value = totalSteps
  }
  
  // Load principals for selection
  principalStore.fetchPrincipals()
}

// Watch for form data changes
watch(
  () => ({ ...formData }),
  (newData) => {
    emit('dataChanged', newData)
  },
  { deep: true }
)

// Auto-save functionality (for creation only)
let autoSaveTimer: ReturnType<typeof setInterval>

const startAutoSave = () => {
  if (!props.isEditing && props.autoSaveInterval > 0) {
    autoSaveTimer = setInterval(() => {
      if (isFormValid.value && formStatus.value === ProductFormSubmissionState.IDLE) {
        saveDraft()
      }
    }, props.autoSaveInterval)
  }
}

const stopAutoSave = () => {
  if (autoSaveTimer) {
    clearInterval(autoSaveTimer)
  }
}

onMounted(() => {
  initializeForm()
  startAutoSave()
})

// Cleanup on unmount
import { onUnmounted } from 'vue'
onUnmounted(() => {
  stopAutoSave()
})

/**
 * Public methods for parent components
 */
defineExpose({
  validateForm,
  resetForm: () => {
    Object.assign(formData, DEFAULT_PRODUCT_FORM_DATA)
    currentStep.value = 1
    validationErrors.value = {}
    submitError.value = null
    formStatus.value = ProductFormSubmissionState.IDLE
  },
  goToStep,
  getFormData: (): ProductFormWrapperData => ({ ...formData })
})
</script>

<style scoped>
.product-form-wrapper {
  @apply max-w-4xl mx-auto;
}

/* Professional Step Transitions */
.step-section {
  @apply transition-all duration-300 ease-out;
}

.step-animation {
  animation: step-entrance 0.4s ease-out;
}

@keyframes step-entrance {
  0% {
    opacity: 0;
    transform: translateY(8px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Professional Completion Feedback */
@keyframes animate-completion-burst {
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
}

@keyframes animate-step-entrance {
  0% { 
    transform: scale(0.95);
    opacity: 0;
  }
  100% { 
    transform: scale(1);
    opacity: 1;
  }
}

/* Step card hover effects */
.step-card {
  transition: all 0.3s ease-in-out;
}

.step-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
}

/* Progress indicator enhanced styles */
.step-circle {
  position: relative;
  z-index: 10;
}

.step-circle.step-active {
  animation: step-pulse 3s ease-in-out infinite;
}

@keyframes step-pulse {
  0%, 100% { 
    box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.2);
  }
  50% { 
    box-shadow: 0 0 0 4px rgba(59, 130, 246, 0);
  }
}

.step-circle.step-completed {
  animation: step-completion 0.3s ease-out;
}

@keyframes step-completion {
  0% { transform: scale(1); }
  50% { transform: scale(1.1); }
  100% { transform: scale(1); }
}

.step-circle.step-completing {
  animation: step-completing 0.3s ease-in-out;
}

@keyframes step-completing {
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
}

.step-circle.step-entering {
  animation: step-entering 0.3s ease-out;
}

@keyframes step-entering {
  0% { transform: scale(0.95); opacity: 0.8; }
  100% { transform: scale(1); opacity: 1; }
}

/* Bounce animation for checkmarks */
@keyframes animate-bounce-once {
  0%, 100% { 
    transform: translateY(0);
  }
  50% { 
    transform: translateY(-4px);
  }
}

.animate-bounce-once {
  animation: animate-bounce-once 0.6s ease-in-out;
}

/* Step connector progress animation */
.step-connector .bg-primary-600 {
  transform-origin: left center;
  animation: connector-fill 0.5s ease-in-out;
}

@keyframes connector-fill {
  0% { transform: scaleX(0); }
  100% { transform: scaleX(1); }
}

/* Removed excessive confetti animations for professional environment */

/* Removed excessive sparkle animations for professional environment */

/* Subtle connector transition */
@keyframes animate-flow {
  0% { opacity: 0.3; }
  100% { opacity: 1; }
}

/* Removed shimmer effect for professional environment */

/* Professional subtle animations */
@keyframes animate-bounce-gentle {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-2px); }
}

@keyframes animate-pulse-gentle {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.85; }
}

/* Removed confetti animation for professional environment */

/* Professional button hover */
.next-button:hover,
.submit-button:hover {
  animation: button-hover 0.2s ease-out;
}

@keyframes button-hover {
  0% { transform: scale(1); }
  100% { transform: scale(1.02); }
}

.next-button:disabled,
.submit-button:disabled {
  animation: none;
  transform: none !important;
}

/* Form focus styles */
.form-input:focus,
.form-select:focus,
.form-textarea:focus {
  @apply ring-2 ring-primary-500 border-primary-500;
  animation: input-focus-glow 0.3s ease-in-out;
}

@keyframes input-focus-glow {
  0% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0); }
  100% { box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2); }
}

/* Step label animations */
.step-label-container {
  transition: all 0.3s ease-in-out;
}

.step-label-container:hover {
  transform: translateY(-1px);
}

/* Removed excessive status pulse animation for professional environment */

/* Professional loading spinner */
.animate-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
  0% { transform: rotate(0deg) scale(1); }
  50% { transform: rotate(180deg) scale(1.1); }
  100% { transform: rotate(360deg) scale(1); }
}

/* Section header animations */
.step-section h3 {
  animation: header-slide-in 0.4s ease-out;
}

@keyframes header-slide-in {
  0% {
    opacity: 0;
    transform: translateX(-20px);
  }
  100% {
    opacity: 1;
    transform: translateX(0);
  }
}

/* Form field focus transitions */
input:focus,
select:focus,
textarea:focus {
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .product-form-wrapper {
    @apply max-w-full mx-4;
  }
  
  .step-section .grid {
    @apply grid-cols-1;
  }

  .step-circle {
    @apply w-6 h-6 text-xs;
  }

  .step-connector {
    @apply w-8;
  }

  /* Reduce animation intensity on mobile */
  .step-card:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
}

/* Confetti particle base styles */
.confetti-particle {
  position: absolute;
  width: 3px;
  height: 3px;
  border-radius: 50%;
  pointer-events: none;
}

.confetti-1 {
  background: linear-gradient(45deg, #3B82F6, #1D4ED8);
  top: 20%;
  left: 20%;
  animation-duration: 1.2s;
}

.confetti-2 {
  background: linear-gradient(45deg, #10B981, #059669);
  top: 80%;
  right: 20%;
  animation-duration: 1.4s;
}

.confetti-3 {
  background: linear-gradient(45deg, #F59E0B, #D97706);
  bottom: 20%;
  left: 70%;
  animation-duration: 1.1s;
}

.confetti-4 {
  background: linear-gradient(45deg, #8B5CF6, #7C3AED);
  top: 40%;
  right: 40%;
  animation-duration: 1.3s;
}

/* Enhanced pulse ring animation */
@keyframes animate-pulse-ring {
  0%, 100% { 
    transform: scale(1);
    opacity: 1;
  }
  50% { 
    transform: scale(1.1);
    opacity: 0.8;
  }
}

.animate-pulse-ring {
  animation: animate-pulse-ring 2s ease-in-out infinite;
}

/* Celebration confetti overlay */
.celebration-confetti {
  position: relative;
  display: inline-block;
}

.celebration-confetti::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 100px;
  height: 100px;
  background: radial-gradient(circle, rgba(59, 130, 246, 0.1) 0%, transparent 70%);
  border-radius: 50%;
  transform: translate(-50%, -50%);
  animation: celebration-glow 1s ease-out infinite;
  pointer-events: none;
}

@keyframes celebration-glow {
  0%, 100% { 
    opacity: 0;
    transform: translate(-50%, -50%) scale(0.5);
  }
  50% { 
    opacity: 1;
    transform: translate(-50%, -50%) scale(2);
  }
}

/* Status indicator enhanced animations */
.status-indicator {
  position: relative;
  overflow: hidden;
}

.status-indicator::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
  transition: left 0.5s ease-in-out;
}

.status-indicator:hover::before {
  left: 100%;
}

/* Enhanced form card interactions */
.step-card {
  position: relative;
  overflow: hidden;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.step-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(90deg, transparent, rgba(59, 130, 246, 0.5), transparent);
  transform: translateX(-100%);
  transition: transform 0.6s ease-out;
}

.step-card:hover::before {
  transform: translateX(100%);
}

/* Accessibility - Enhanced reduced motion support */
@media (prefers-reduced-motion: reduce) {
  /* All complex animations already removed for professional environment */
  * {
    animation-duration: 0.01ms !important;
    animation-delay: -1ms !important;
  }
  
  /* Reduce complex transitions */
  .step-section,
  .step-animation,
  .step-card,
  .step-circle {
    transition: opacity 0.2s ease, transform 0.2s ease !important;
    animation: none !important;
  }
  
  /* Preserve essential interactive feedback */
  .step-circle:hover,
  .next-button:hover,
  .submit-button:hover {
    transform: scale(1.05) !important;
    transition: transform 0.1s ease !important;
  }
  
  .step-card:hover {
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1) !important;
    transform: translateY(-1px) !important;
  }
  
  /* Keep status changes visible */
  .status-indicator {
    transition: background-color 0.3s ease !important;
  }
}

/* High contrast mode */
@media (prefers-contrast: high) {
  .step-circle {
    border-width: 3px;
  }
  
  .step-connector {
    height: 2px;
  }
  
  .bg-blue-50,
  .bg-green-50,
  .bg-red-50 {
    border-width: 2px;
  }
}

/* Print styles */
@media print {
  .product-form-wrapper {
    @apply shadow-none;
  }
  
  .form-actions,
  .step-section h3 span.w-2 {
    @apply hidden;
  }
  
  .step-card {
    box-shadow: none;
    transform: none;
  }
  
  /* Simplify step indicators for print */
  .step-circle {
    @apply border-2 border-gray-400;
  }
}

/* Dark mode support (if implemented) */
@media (prefers-color-scheme: dark) {
  .step-card {
    @apply bg-gray-800 border-gray-700;
  }
  
  .step-circle.step-pending {
    @apply border-gray-600 text-gray-400;
  }
}
</style>