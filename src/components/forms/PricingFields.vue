<template>
  <div class="pricing-fields">
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <!-- Unit Price -->
      <div>
        <label for="unit-price" class="block text-sm font-medium text-gray-700 mb-1">
          Unit Price
        </label>
        <div class="relative">
          <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span class="text-gray-500 sm:text-sm">$</span>
          </div>
          <input
            id="unit-price"
            type="number"
            step="0.01"
            min="0"
            max="999999.99"
            :value="unitPrice"
            @input="handleUnitPriceInput"
            @blur="handleUnitPriceBlur"
            placeholder="0.00"
            :class="[
              'w-full pl-7 pr-12 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 transition-colors duration-200',
              unitPriceError ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-primary-500'
            ]"
            :aria-invalid="!!unitPriceError"
            :aria-describedby="unitPriceError ? 'unit-price-error' : undefined"
          />
          <div class="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <span class="text-gray-500 text-sm">{{ currency }}</span>
          </div>
        </div>
        <p v-if="unitPriceError" id="unit-price-error" class="mt-1 text-sm text-red-600">
          {{ unitPriceError }}
        </p>
      </div>

      <!-- Cost Price -->
      <div>
        <label for="cost-price" class="block text-sm font-medium text-gray-700 mb-1">
          Cost Price
          <span class="text-xs text-gray-500 ml-1">(Optional)</span>
        </label>
        <div class="relative">
          <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span class="text-gray-500 sm:text-sm">$</span>
          </div>
          <input
            id="cost-price"
            type="number"
            step="0.01"
            min="0"
            max="999999.99"
            :value="costPrice"
            @input="handleCostPriceInput"
            @blur="handleCostPriceBlur"
            placeholder="0.00"
            :class="[
              'w-full pl-7 pr-12 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 transition-colors duration-200',
              costPriceError ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-primary-500'
            ]"
            :aria-invalid="!!costPriceError"
            :aria-describedby="costPriceError ? 'cost-price-error' : undefined"
          />
          <div class="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <span class="text-gray-500 text-sm">{{ currency }}</span>
          </div>
        </div>
        <p v-if="costPriceError" id="cost-price-error" class="mt-1 text-sm text-red-600">
          {{ costPriceError }}
        </p>
      </div>

      <!-- Currency -->
      <div>
        <label for="currency" class="block text-sm font-medium text-gray-700 mb-1">
          Currency
        </label>
        <select
          id="currency"
          :value="currency"
          @change="handleCurrencyChange"
          :class="[
            'w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 transition-colors duration-200',
            currencyError ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-primary-500'
          ]"
          :aria-invalid="!!currencyError"
          :aria-describedby="currencyError ? 'currency-error' : undefined"
        >
          <option value="USD">USD - US Dollar</option>
          <option value="CAD">CAD - Canadian Dollar</option>
          <option value="EUR">EUR - Euro</option>
          <option value="GBP">GBP - British Pound</option>
        </select>
        <p v-if="currencyError" id="currency-error" class="mt-1 text-sm text-red-600">
          {{ currencyError }}
        </p>
      </div>
    </div>

    <!-- Profit Margin Calculator -->
    <div v-if="showProfitMargin && unitPrice && costPrice" class="mt-4 p-3 bg-green-50 rounded-lg">
      <div class="flex items-center justify-between text-sm">
        <span class="font-medium text-green-800">Profit Margin:</span>
        <span class="text-green-900">{{ profitMarginPercent }}% (${{ profitAmount }})</span>
      </div>
    </div>

    <!-- Pricing Guidelines -->
    <div v-if="showGuidelines" class="mt-4 p-3 bg-blue-50 rounded-lg">
      <div class="text-sm text-blue-800">
        <div class="font-medium mb-1">Pricing Guidelines:</div>
        <ul class="text-xs space-y-1 text-blue-700">
          <li>• Cost price helps calculate profit margins</li>
          <li>• Unit price is what customers pay</li>
          <li>• Consider market rates and competition</li>
          <li>• Leave prices blank if pricing varies by customer</li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
// Currency enum removed - not used in component

interface Props {
  unitPrice: number | null
  costPrice: number | null
  currency: string
  unitPriceError?: string
  costPriceError?: string
  currencyError?: string
  showProfitMargin?: boolean
  showGuidelines?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showProfitMargin: true,
  showGuidelines: true
})

interface Emits {
  'update:unitPrice': [value: number | null]
  'update:costPrice': [value: number | null]
  'update:currency': [value: string]
}

const emit = defineEmits<Emits>()

const profitAmount = computed(() => {
  if (!props.unitPrice || !props.costPrice) return '0.00'
  const profit = props.unitPrice - props.costPrice
  return profit.toFixed(2)
})

const profitMarginPercent = computed(() => {
  if (!props.unitPrice || !props.costPrice || props.unitPrice === 0) return '0.0'
  const margin = ((props.unitPrice - props.costPrice) / props.unitPrice) * 100
  return margin.toFixed(1)
})

const handleUnitPriceInput = (event: Event) => {
  const target = event.target as HTMLInputElement
  const value = target.value ? parseFloat(target.value) : null
  emit('update:unitPrice', value)
}

const handleUnitPriceBlur = (event: Event) => {
  const target = event.target as HTMLInputElement
  if (target.value && !isNaN(parseFloat(target.value))) {
    target.value = parseFloat(target.value).toFixed(2)
  }
}

const handleCostPriceInput = (event: Event) => {
  const target = event.target as HTMLInputElement
  const value = target.value ? parseFloat(target.value) : null
  emit('update:costPrice', value)
}

const handleCostPriceBlur = (event: Event) => {
  const target = event.target as HTMLInputElement
  if (target.value && !isNaN(parseFloat(target.value))) {
    target.value = parseFloat(target.value).toFixed(2)
  }
}

const handleCurrencyChange = (event: Event) => {
  const target = event.target as HTMLSelectElement
  emit('update:currency', target.value)
}
</script>