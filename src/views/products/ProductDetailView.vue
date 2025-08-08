<template>
  <!-- Delightful Loading State -->
  <div v-if="loading" class="text-center py-12">
    <div class="inline-flex items-center">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-3 transition-all duration-300 hover:scale-110"></div>
      <span class="text-lg text-gray-600 animate-pulse">{{ loadingMessages[currentLoadingMessage] }}</span>
    </div>
  </div>

  <!-- Encouraging Error State -->
  <div v-else-if="error" class="text-center py-12 animate-fade-in">
    <div class="text-red-600 mb-4 transition-transform duration-300 hover:scale-105">
      <ExclamationTriangleIcon class="h-16 w-16 mx-auto animate-bounce" />
    </div>
    <h3 class="text-xl font-medium text-gray-900 mb-2">Oops! Something went sideways</h3>
    <p class="text-gray-600 mb-6">{{ error }}</p>
    <div class="space-x-4">
      <button
        @click="loadProduct"
        class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-600 bg-blue-100 hover:bg-blue-200 transform transition-all duration-200 hover:scale-105 active:scale-95 hover:shadow-lg"
      >
        <ArrowPathIcon class="h-4 w-4 mr-2 transition-transform duration-200 hover:rotate-180" />
        Give it another shot
      </button>
      <router-link
        to="/products"
        class="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transform transition-all duration-200 hover:scale-105 active:scale-95"
      >
        Head back to safety
      </router-link>
    </div>
  </div>

  <!-- Smooth Page Entry Animation -->
  <div v-else-if="product" class="space-y-6 animate-page-enter">
    <!-- Enhanced Page Header -->
    <div class="flex items-start justify-between animate-slide-up" style="animation-delay: 0.1s">
      <div class="min-w-0 flex-1">
        <!-- Delightful Breadcrumb Navigation -->
        <nav class="flex items-center space-x-2 text-sm text-gray-500 mb-2">
          <router-link 
            to="/products" 
            class="hover:text-blue-600 transition-colors duration-200 hover:underline decoration-2 underline-offset-4"
          >
            Products
          </router-link>
          <ChevronRightIcon class="h-4 w-4 transition-transform duration-200 hover:translate-x-1" />
          <span class="text-gray-900 truncate font-medium">{{ product.name }}</span>
        </nav>
        
        <!-- Enhanced Product Header -->
        <div class="flex items-center space-x-4">
          <!-- Animated Category Icon -->
          <div class="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center transition-all duration-300 hover:scale-110 hover:rotate-6 hover:shadow-lg group">
            <span class="text-2xl transform transition-transform duration-300 group-hover:scale-125">
              {{ getCategoryIcon(product.category) }}
            </span>
          </div>
          
          <div class="min-w-0 flex-1">
            <!-- Animated Product Name -->
            <h1 class="text-2xl font-bold text-gray-900 truncate transition-all duration-300 hover:text-blue-600">
              {{ product.name }}
            </h1>
            
            <!-- Enhanced Badge Animation -->
            <div class="flex items-center space-x-4 mt-1">
              <span v-if="product.category" 
                :class="getCategoryBadgeClasses(product.category)"
                class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium transition-all duration-300 hover:scale-105 hover:shadow-md"
              >
                {{ product.category }}
              </span>
              <span
                :class="[
                  'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium transition-all duration-300 hover:scale-105',
                  product.is_active 
                    ? 'bg-green-100 text-green-800 hover:bg-green-200 animate-pulse-gentle' 
                    : 'bg-red-100 text-red-800 hover:bg-red-200'
                ]"
              >
                <span 
                  :class="[
                    'w-2 h-2 rounded-full mr-2 transition-all duration-300',
                    product.is_active ? 'bg-green-500 animate-ping-slow' : 'bg-red-500'
                  ]"
                ></span>
                {{ product.is_active ? 'Active' : 'Inactive' }}
              </span>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Enhanced Action Buttons -->
      <div class="flex items-center space-x-3 ml-4 animate-slide-left" style="animation-delay: 0.2s">
        <router-link
          :to="`/products/${product.id}/edit`"
          class="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transform transition-all duration-200 hover:scale-105 active:scale-95 hover:shadow-lg group"
        >
          <PencilIcon class="h-4 w-4 mr-2 transition-transform duration-200 group-hover:rotate-12" />
          Edit Product
        </router-link>
        
        <button
          @click="confirmDelete"
          class="inline-flex items-center px-4 py-2 border border-red-300 text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50 hover:border-red-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transform transition-all duration-200 hover:scale-105 active:scale-95 hover:shadow-lg group"
        >
          <TrashIcon class="h-4 w-4 mr-2 transition-transform duration-200 group-hover:rotate-12" />
          Remove
        </button>
      </div>
    </div>

    <!-- Enhanced Product Information Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Main Information with Staggered Animation -->
      <div class="lg:col-span-2 space-y-6">
        <!-- Enhanced Basic Details -->
        <div 
          class="bg-white shadow-sm rounded-lg border border-gray-200 transition-all duration-300 hover:shadow-lg hover:border-blue-200 animate-slide-up group"
          style="animation-delay: 0.3s"
        >
          <div class="px-6 py-4 border-b border-gray-200 transition-colors duration-300 group-hover:bg-blue-50">
            <h3 class="text-lg font-medium text-gray-900 flex items-center">
              <DocumentTextIcon class="h-5 w-5 mr-2 text-blue-500 transition-transform duration-300 group-hover:scale-110" />
              Product Details
            </h3>
          </div>
          
          <div class="px-6 py-6 space-y-6">
            <div v-if="product.description" class="prose max-w-none">
              <p class="text-gray-700 transition-all duration-300 hover:text-gray-900 leading-relaxed">
                {{ product.description }}
              </p>
            </div>
            
            <!-- Enhanced Information Grid -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div 
                v-if="product.sku" 
                class="group transition-all duration-300 hover:bg-blue-50 hover:border-blue-200 p-3 rounded-md border border-transparent"
              >
                <dt class="text-sm font-medium text-gray-500 flex items-center group-hover:text-blue-600">
                  <span class="w-2 h-2 bg-blue-500 rounded-full mr-2 transition-transform duration-300 group-hover:scale-125"></span>
                  SKU
                </dt>
                <dd class="mt-1 text-sm text-gray-900 font-mono transition-colors duration-300 group-hover:text-blue-900">
                  {{ product.sku }}
                </dd>
              </div>
              
              <div 
                v-if="product.unit_price" 
                class="group transition-all duration-300 hover:bg-green-50 hover:border-green-200 p-3 rounded-md border border-transparent"
              >
                <dt class="text-sm font-medium text-gray-500 flex items-center group-hover:text-green-600">
                  <CurrencyDollarIcon class="h-4 w-4 mr-2 transition-transform duration-300 group-hover:scale-110" />
                  Unit Price
                </dt>
                <dd class="mt-1 text-sm text-gray-900 font-semibold transition-colors duration-300 group-hover:text-green-900">
                  $<span class="animate-number-count">{{ formatPrice(product.unit_price) }}</span>
                </dd>
              </div>
              
              <div 
                v-if="product.created_at" 
                class="group transition-all duration-300 hover:bg-purple-50 hover:border-purple-200 p-3 rounded-md border border-transparent"
              >
                <dt class="text-sm font-medium text-gray-500 flex items-center group-hover:text-purple-600">
                  <CalendarDaysIcon class="h-4 w-4 mr-2 transition-transform duration-300 group-hover:scale-110" />
                  Created
                </dt>
                <dd class="mt-1 text-sm text-gray-900 transition-colors duration-300 group-hover:text-purple-900">
                  {{ formatDate(product.created_at) }}
                </dd>
              </div>
              
              <div 
                v-if="product.updated_at" 
                class="group transition-all duration-300 hover:bg-yellow-50 hover:border-yellow-200 p-3 rounded-md border border-transparent"
              >
                <dt class="text-sm font-medium text-gray-500 flex items-center group-hover:text-yellow-600">
                  <ClockIcon class="h-4 w-4 mr-2 transition-transform duration-300 group-hover:scale-110" />
                  Last Updated
                </dt>
                <dd class="mt-1 text-sm text-gray-900 transition-colors duration-300 group-hover:text-yellow-900">
                  {{ formatDate(product.updated_at) }}
                </dd>
              </div>
            </div>
          </div>
        </div>

        <!-- Enhanced Principal Relationships -->
        <div 
          class="bg-white shadow-sm rounded-lg border border-gray-200 transition-all duration-300 hover:shadow-lg hover:border-purple-200 animate-slide-up group"
          style="animation-delay: 0.4s"
        >
          <div class="px-6 py-4 border-b border-gray-200 flex items-center justify-between transition-colors duration-300 group-hover:bg-purple-50">
            <h3 class="text-lg font-medium text-gray-900 flex items-center">
              <UserGroupIcon class="h-5 w-5 mr-2 text-purple-500 transition-transform duration-300 group-hover:scale-110" />
              Principal Relationships
            </h3>
            <button
              @click="loadPrincipalRelationships"
              class="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-purple-50 hover:border-purple-300 hover:text-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transform transition-all duration-200 hover:scale-105 active:scale-95 group"
            >
              <ArrowPathIcon class="h-4 w-4 mr-2 transition-transform duration-300 group-hover:rotate-180" />
              {{ loadingPrincipals ? 'Refreshing...' : 'Refresh Data' }}
            </button>
          </div>
          
          <div class="px-6 py-6">
            <!-- Delightful Loading State -->
            <div v-if="loadingPrincipals" class="flex flex-col items-center justify-center py-8">
              <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mb-3"></div>
              <span class="text-sm text-gray-600 animate-pulse">{{ loadingMessages[currentLoadingMessage] }}</span>
            </div>
            
            <!-- Encouraging Empty State -->
            <div v-else-if="principalRelationships.length === 0" class="text-center py-8 text-gray-500">
              <div class="transition-transform duration-300 hover:scale-110">
                <UserGroupIcon class="h-12 w-12 mx-auto mb-3 text-gray-300" />
              </div>
              <h4 class="text-sm font-medium text-gray-900 mb-1">No relationships yet</h4>
              <p class="text-sm text-gray-500 mb-4">Connect with principals to start tracking performance</p>
              <button class="inline-flex items-center text-purple-600 hover:text-purple-700 text-sm font-medium transition-colors duration-200">
                <PlusIcon class="h-4 w-4 mr-1" />
                Add Principal Relationship
              </button>
            </div>
            
            <!-- Enhanced Relationship Cards -->
            <div v-else class="space-y-4">
              <div 
                v-for="(relationship, index) in principalRelationships" 
                :key="relationship.principal_id"
                class="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-purple-50 hover:border-purple-300 transition-all duration-300 hover:shadow-md transform hover:scale-[1.02] animate-slide-up group"
                :style="`animation-delay: ${0.1 * index}s`"
              >
                <div class="flex items-center space-x-3">
                  <div class="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:bg-purple-200">
                    <BuildingOfficeIcon class="h-6 w-6 text-purple-600 transition-transform duration-300 group-hover:scale-110" />
                  </div>
                  <div>
                    <h4 class="text-sm font-medium text-gray-900 transition-colors duration-300 group-hover:text-purple-900">
                      {{ relationship.principal_name }}
                    </h4>
                    <p class="text-xs text-gray-500 flex items-center">
                      <span class="w-2 h-2 bg-green-400 rounded-full mr-1 animate-pulse"></span>
                      {{ relationship.is_primary_principal ? 'Primary Principal' : 'Secondary Principal' }}
                    </p>
                  </div>
                </div>
                
                <div class="flex items-center space-x-6">
                  <!-- Opportunity Count with Animation -->
                  <div class="text-right">
                    <div class="flex items-center text-sm font-medium text-gray-900 mb-1">
                      <TrophyIcon class="h-4 w-4 mr-1 text-yellow-500" />
                      <span class="animate-number-count">{{ relationship.opportunities_for_product || 0 }}</span>
                    </div>
                    <p class="text-xs text-gray-500">opportunities</p>
                  </div>
                  
                  <!-- Win Rate with Progress Bar -->
                  <div class="text-right min-w-[80px]">
                    <div class="flex items-center justify-end mb-1">
                      <span class="text-sm font-semibold text-purple-600">
                        {{ relationship.win_rate || 0 }}%
                      </span>
                    </div>
                    <div class="w-16 bg-gray-200 rounded-full h-2 overflow-hidden">
                      <div 
                        class="bg-gradient-to-r from-purple-500 to-purple-600 h-2 rounded-full transition-all duration-1000 ease-out animate-progress-fill" 
                        :style="`width: ${relationship.win_rate || 0}%`"
                      ></div>
                    </div>
                  </div>
                  
                  <!-- Interaction Button -->
                  <button class="p-2 text-gray-400 hover:text-purple-600 transition-colors duration-200 hover:bg-purple-100 rounded-full">
                    <EyeIcon class="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Enhanced Performance Analytics -->
        <div 
          class="bg-white shadow-sm rounded-lg border border-gray-200 transition-all duration-300 hover:shadow-lg hover:border-green-200 animate-slide-up group"
          style="animation-delay: 0.5s"
        >
          <div class="px-6 py-4 border-b border-gray-200 transition-colors duration-300 group-hover:bg-green-50">
            <h3 class="text-lg font-medium text-gray-900 flex items-center">
              <PresentationChartLineIcon class="h-5 w-5 mr-2 text-green-500 transition-transform duration-300 group-hover:scale-110" />
              Performance Analytics
            </h3>
          </div>
          
          <div class="px-6 py-6">
            <!-- Enhanced KPI Cards -->
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
              <!-- Total Opportunities -->
              <div 
                class="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg transition-all duration-300 hover:shadow-lg hover:scale-105 group animate-slide-up"
                style="animation-delay: 0.6s"
              >
                <div class="flex items-center justify-between">
                  <div class="flex items-center">
                    <div class="p-2 bg-blue-500 rounded-lg transition-transform duration-300 group-hover:scale-110">
                      <PresentationChartLineIcon class="h-5 w-5 text-white" />
                    </div>
                  </div>
                  <div class="text-right">
                    <span class="text-sm font-medium text-blue-800 block">Total Opportunities</span>
                    <p class="text-2xl font-bold text-blue-600 mt-1">
                      <span ref="totalOppCounter" class="animate-number-count-up">{{ totalOpportunities }}</span>
                    </p>
                  </div>
                </div>
              </div>
              
              <!-- Won Opportunities -->
              <div 
                class="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg transition-all duration-300 hover:shadow-lg hover:scale-105 group animate-slide-up"
                style="animation-delay: 0.7s"
              >
                <div class="flex items-center justify-between">
                  <div class="flex items-center">
                    <div class="p-2 bg-green-500 rounded-lg transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6">
                      <TrophyIcon class="h-5 w-5 text-white" />
                    </div>
                  </div>
                  <div class="text-right">
                    <span class="text-sm font-medium text-green-800 block">Won Opportunities</span>
                    <p class="text-2xl font-bold text-green-600 mt-1 flex items-center">
                      <span ref="wonOppCounter" class="animate-number-count-up">{{ wonOpportunities }}</span>
                      <span class="text-sm ml-2 animate-bounce">🎉</span>
                    </p>
                  </div>
                </div>
              </div>
              
              <!-- Win Rate -->
              <div 
                class="bg-gradient-to-br from-yellow-50 to-yellow-100 p-4 rounded-lg transition-all duration-300 hover:shadow-lg hover:scale-105 group animate-slide-up"
                style="animation-delay: 0.8s"
              >
                <div class="flex items-center justify-between">
                  <div class="flex items-center">
                    <div class="p-2 bg-yellow-500 rounded-lg transition-transform duration-300 group-hover:scale-110">
                      <ChartBarIcon class="h-5 w-5 text-white" />
                    </div>
                  </div>
                  <div class="text-right">
                    <span class="text-sm font-medium text-yellow-800 block">Success Rate</span>
                    <p class="text-2xl font-bold text-yellow-600 mt-1 flex items-center">
                      <span ref="winRateCounter" class="animate-number-count-up">{{ winRate }}</span>
                      <span class="text-xl ml-1">%</span>
                      <span v-if="winRate > 70" class="text-sm ml-2">⭐</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <!-- Enhanced Performance by Principal -->
            <div v-if="principalRelationships.length > 0" class="animate-slide-up" style="animation-delay: 0.9s">
              <h4 class="text-sm font-medium text-gray-900 mb-4 flex items-center">
                <span class="w-3 h-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full mr-2"></span>
                Performance by Principal
              </h4>
              <div class="space-y-3">
                <div 
                  v-for="(relationship, index) in principalRelationships" 
                  :key="relationship.principal_id"
                  class="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gradient-to-r hover:from-gray-50 hover:to-blue-50 hover:border-blue-200 transition-all duration-300 hover:shadow-md animate-slide-up group"
                  :style="`animation-delay: ${1 + 0.1 * index}s`"
                >
                  <div class="flex items-center space-x-3">
                    <div class="w-3 h-3 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 animate-pulse"></div>
                    <span class="text-sm font-medium text-gray-900 transition-colors duration-300 group-hover:text-blue-900">
                      {{ relationship.principal_name }}
                    </span>
                  </div>
                  
                  <div class="flex items-center space-x-4">
                    <!-- Opportunities Badge -->
                    <div class="flex items-center bg-gray-100 rounded-full px-3 py-1 transition-all duration-300 group-hover:bg-blue-100">
                      <span class="text-sm text-gray-600 group-hover:text-blue-600">
                        {{ relationship.opportunities_for_product || 0 }} ops
                      </span>
                    </div>
                    
                    <!-- Animated Progress Bar -->
                    <div class="flex items-center space-x-2 min-w-[100px]">
                      <div class="w-20 bg-gray-200 rounded-full h-2.5 overflow-hidden">
                        <div 
                          class="bg-gradient-to-r from-blue-500 to-purple-500 h-2.5 rounded-full transition-all duration-1000 ease-out animate-progress-fill hover:from-purple-500 hover:to-blue-500" 
                          :style="`width: ${relationship.win_rate || 0}%`"
                        ></div>
                      </div>
                      <span class="text-sm font-semibold text-gray-700 w-10 transition-colors duration-300 group-hover:text-blue-600">
                        {{ relationship.win_rate || 0 }}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Enhanced Sidebar -->
      <div class="space-y-6">
        <!-- Enhanced Quick Stats -->
        <div 
          class="bg-white shadow-sm rounded-lg border border-gray-200 transition-all duration-300 hover:shadow-lg hover:border-blue-200 animate-slide-right group"
          style="animation-delay: 1.1s"
        >
          <div class="px-6 py-4 border-b border-gray-200 transition-colors duration-300 group-hover:bg-blue-50">
            <h3 class="text-lg font-medium text-gray-900 flex items-center">
              <ChartBarIcon class="h-5 w-5 mr-2 text-blue-500 transition-transform duration-300 group-hover:scale-110" />
              Quick Stats
            </h3>
          </div>
          
          <div class="px-6 py-6 space-y-4">
            <!-- Status with Animation -->
            <div class="flex items-center justify-between group transition-all duration-300 hover:bg-gray-50 -mx-2 px-2 py-2 rounded-md">
              <span class="text-sm text-gray-500 flex items-center">
                <span class="w-2 h-2 bg-gray-400 rounded-full mr-2 group-hover:scale-125 transition-transform duration-300"></span>
                Status
              </span>
              <span
                :class="[
                  'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium transition-all duration-300 hover:scale-105',
                  product.is_active 
                    ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                    : 'bg-red-100 text-red-800 hover:bg-red-200'
                ]"
              >
                <span 
                  :class="[
                    'w-2 h-2 rounded-full mr-1.5',
                    product.is_active ? 'bg-green-500 animate-pulse' : 'bg-red-500'
                  ]"
                ></span>
                {{ product.is_active ? 'Active' : 'Inactive' }}
              </span>
            </div>
            
            <!-- Category with Hover Effect -->
            <div v-if="product.category" class="flex items-center justify-between group transition-all duration-300 hover:bg-purple-50 -mx-2 px-2 py-2 rounded-md">
              <span class="text-sm text-gray-500 flex items-center group-hover:text-purple-600">
                <span class="text-base mr-2 transition-transform duration-300 group-hover:scale-125">{{ getCategoryIcon(product.category) }}</span>
                Category
              </span>
              <span class="text-sm font-medium text-gray-900 transition-colors duration-300 group-hover:text-purple-900">
                {{ product.category }}
              </span>
            </div>
            
            <!-- Principals Count with Animation -->
            <div class="flex items-center justify-between group transition-all duration-300 hover:bg-blue-50 -mx-2 px-2 py-2 rounded-md">
              <span class="text-sm text-gray-500 flex items-center group-hover:text-blue-600">
                <UserGroupIcon class="h-4 w-4 mr-2 transition-transform duration-300 group-hover:scale-110" />
                Principals
              </span>
              <div class="flex items-center">
                <span class="text-sm font-medium text-gray-900 transition-colors duration-300 group-hover:text-blue-900">
                  {{ principalRelationships.length }}
                </span>
                <span v-if="principalRelationships.length > 0" class="text-xs text-green-500 ml-2 animate-pulse">●</span>
              </div>
            </div>
            
            <!-- Unit Price with Hover Animation -->
            <div v-if="product.unit_price" class="flex items-center justify-between group transition-all duration-300 hover:bg-green-50 -mx-2 px-2 py-2 rounded-md">
              <span class="text-sm text-gray-500 flex items-center group-hover:text-green-600">
                <CurrencyDollarIcon class="h-4 w-4 mr-2 transition-transform duration-300 group-hover:scale-110" />
                Unit Price
              </span>
              <span class="text-sm font-medium text-gray-900 transition-colors duration-300 group-hover:text-green-900">
                ${{ formatPrice(product.unit_price) }}
              </span>
            </div>
          </div>
        </div>

        <!-- Enhanced Quick Actions -->
        <div 
          class="bg-white shadow-sm rounded-lg border border-gray-200 transition-all duration-300 hover:shadow-lg hover:border-green-200 animate-slide-right group"
          style="animation-delay: 1.2s"
        >
          <div class="px-6 py-4 border-b border-gray-200 transition-colors duration-300 group-hover:bg-green-50">
            <h3 class="text-lg font-medium text-gray-900 flex items-center">
              <span class="w-2 h-2 bg-green-500 rounded-full mr-3 animate-pulse"></span>
              Quick Actions
            </h3>
          </div>
          
          <div class="px-6 py-6 space-y-3">
            <!-- Edit Product Button -->
            <router-link
              :to="`/products/${product.id}/edit`"
              class="w-full inline-flex items-center justify-center px-4 py-3 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 transform transition-all duration-200 hover:scale-105 active:scale-95 hover:shadow-lg group"
            >
              <PencilIcon class="h-4 w-4 mr-2 transition-transform duration-200 group-hover:rotate-12" />
              <span class="transition-all duration-200">Edit Product Details</span>
            </router-link>
            
            <!-- Create Opportunity Button -->
            <router-link
              :to="createOpportunityRoute"
              class="w-full inline-flex items-center justify-center px-4 py-3 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 transform transition-all duration-200 hover:scale-105 active:scale-95 hover:shadow-lg group"
            >
              <div class="flex items-center">
                <PlusIcon class="h-4 w-4 mr-2 transition-transform duration-200 group-hover:rotate-90" />
                <span class="transition-all duration-200">Create Opportunity</span>
                <span class="ml-2 text-xs opacity-75 group-hover:opacity-100 transition-opacity duration-200">🚀</span>
              </div>
            </router-link>
            
            <!-- View Principals Button -->
            <button
              @click="loadPrincipalRelationships"
              class="w-full inline-flex items-center justify-center px-4 py-3 border border-purple-300 text-sm font-medium rounded-lg text-purple-700 bg-purple-50 hover:bg-purple-100 hover:border-purple-400 hover:text-purple-800 transform transition-all duration-200 hover:scale-105 active:scale-95 hover:shadow-lg group"
            >
              <BuildingOfficeIcon class="h-4 w-4 mr-2 transition-transform duration-200 group-hover:scale-110" />
              <span class="transition-all duration-200">{{ loadingPrincipals ? 'Refreshing...' : 'Refresh Principals' }}</span>
              <ArrowPathIcon v-if="loadingPrincipals" class="h-3 w-3 ml-2 animate-spin" />
            </button>
          </div>
        </div>

        <!-- Enhanced Recent Activity -->
        <div 
          class="bg-white shadow-sm rounded-lg border border-gray-200 transition-all duration-300 hover:shadow-lg hover:border-yellow-200 animate-slide-right group"
          style="animation-delay: 1.3s"
        >
          <div class="px-6 py-4 border-b border-gray-200 transition-colors duration-300 group-hover:bg-yellow-50">
            <h3 class="text-lg font-medium text-gray-900 flex items-center">
              <ClockIcon class="h-5 w-5 mr-2 text-yellow-500 transition-transform duration-300 group-hover:scale-110" />
              Recent Activity
            </h3>
          </div>
          
          <div class="px-6 py-6">
            <div class="text-center py-6 text-gray-500">
              <div class="transition-transform duration-300 hover:scale-110 mb-4">
                <ClockIcon class="h-12 w-12 mx-auto text-gray-300" />
              </div>
              <h4 class="text-sm font-medium text-gray-900 mb-2">Activity Dashboard Coming Soon</h4>
              <p class="text-sm text-gray-500 mb-4">Track interactions, updates, and performance insights</p>
              <div class="space-y-2">
                <div class="flex items-center justify-center text-xs text-gray-400">
                  <span class="w-2 h-2 bg-gray-300 rounded-full mr-2 animate-pulse"></span>
                  Opportunity tracking
                </div>
                <div class="flex items-center justify-center text-xs text-gray-400">
                  <span class="w-2 h-2 bg-gray-300 rounded-full mr-2 animate-pulse" style="animation-delay: 0.5s"></span>
                  Principal interactions
                </div>
                <div class="flex items-center justify-center text-xs text-gray-400">
                  <span class="w-2 h-2 bg-gray-300 rounded-full mr-2 animate-pulse" style="animation-delay: 1s"></span>
                  Performance insights
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Enhanced Related Opportunities -->
    <div 
      class="bg-white shadow-sm rounded-lg border border-gray-200 transition-all duration-300 hover:shadow-lg hover:border-green-200 animate-slide-up group"
      style="animation-delay: 1.4s"
    >
      <div class="px-6 py-4 border-b border-gray-200 transition-colors duration-300 group-hover:bg-green-50">
        <div class="flex items-center justify-between">
          <h3 class="text-lg font-medium text-gray-900 flex items-center">
            <CurrencyDollarIcon class="h-5 w-5 mr-2 text-green-500 transition-transform duration-300 group-hover:scale-110" />
            Related Opportunities
          </h3>
          <router-link
            :to="createOpportunityRoute"
            class="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-lg text-green-600 bg-green-100 hover:bg-green-200 hover:text-green-700 transform transition-all duration-200 hover:scale-105 active:scale-95 hover:shadow-md group"
          >
            <PlusIcon class="h-4 w-4 mr-1 transition-transform duration-200 group-hover:rotate-90" />
            Create New Opportunity
          </router-link>
        </div>
      </div>
      
      <div class="px-6 py-8">
        <div class="text-center py-6 text-gray-500">
          <div class="transition-transform duration-300 hover:scale-110 mb-4">
            <CurrencyDollarIcon class="h-16 w-16 mx-auto text-gray-300" />
          </div>
          <h4 class="text-lg font-medium text-gray-900 mb-2">Opportunities Integration</h4>
          <p class="text-sm text-gray-500 mb-6">Connect and track opportunities related to this product</p>
          
          <!-- Feature Preview -->
          <div class="max-w-sm mx-auto space-y-3 text-left">
            <div class="flex items-center text-sm text-gray-600 bg-gray-50 p-3 rounded-lg hover:bg-green-50 transition-colors duration-200">
              <TrophyIcon class="h-4 w-4 mr-3 text-green-500" />
              View active opportunities
            </div>
            <div class="flex items-center text-sm text-gray-600 bg-gray-50 p-3 rounded-lg hover:bg-blue-50 transition-colors duration-200">
              <PresentationChartLineIcon class="h-4 w-4 mr-3 text-blue-500" />
              Track performance metrics
            </div>
            <div class="flex items-center text-sm text-gray-600 bg-gray-50 p-3 rounded-lg hover:bg-purple-50 transition-colors duration-200">
              <BuildingOfficeIcon class="h-4 w-4 mr-3 text-purple-500" />
              Principal-specific insights
            </div>
          </div>
          
          <router-link
            :to="createOpportunityRoute"
            class="inline-flex items-center mt-6 text-green-600 hover:text-green-700 text-sm font-medium transition-colors duration-200 group"
          >
            <span class="border-b border-green-300 group-hover:border-green-500 transition-colors duration-200">
              Get started with your first opportunity
            </span>
            <span class="ml-2 transition-transform duration-200 group-hover:translate-x-1">→</span>
          </router-link>
        </div>
      </div>
    </div>
  </div>

  <!-- Enhanced Delete Confirmation Modal -->
  <div v-if="showDeleteModal" class="fixed inset-0 bg-black bg-opacity-60 overflow-y-auto h-full w-full z-50 animate-fade-in">
    <div class="relative top-20 mx-auto p-6 border max-w-md shadow-2xl rounded-2xl bg-white animate-modal-slide-up">
      <div class="text-center">
        <!-- Animated Warning Icon -->
        <div class="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-orange-100 mb-4 transition-all duration-300 hover:scale-110">
          <ExclamationTriangleIcon class="h-8 w-8 text-orange-600 animate-bounce" />
        </div>
        
        <!-- Modal Content -->
        <h3 class="text-xl font-semibold text-gray-900 mb-2">Hold on there! ✋</h3>
        <p class="text-gray-600 mb-1">You're about to remove</p>
        <p class="text-lg font-bold text-gray-900 mb-4">{{ product?.name }}</p>
        
        <!-- Information Card -->
        <div class="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-left">
          <div class="flex items-start">
            <InformationCircleIcon class="h-5 w-5 text-blue-500 mr-3 mt-0.5 flex-shrink-0" />
            <div class="text-sm">
              <p class="text-blue-800 font-medium mb-1">What happens next:</p>
              <ul class="text-blue-700 space-y-1 text-xs">
                <li>• Product will be marked as inactive</li>
                <li>• Data remains accessible for reporting</li>
                <li>• Principal relationships are preserved</li>
                <li>• This action can be reversed later</li>
              </ul>
            </div>
          </div>
        </div>
        
        <!-- Enhanced Action Buttons -->
        <div class="flex space-x-3 justify-center">
          <button
            @click="showDeleteModal = false"
            class="px-6 py-3 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg shadow-sm hover:bg-gray-200 hover:text-gray-800 transform transition-all duration-200 hover:scale-105 active:scale-95 hover:shadow-md group"
          >
            <span class="flex items-center">
              <span class="transition-transform duration-200 group-hover:-translate-x-1">←</span>
              <span class="ml-2">Keep it safe</span>
            </span>
          </button>
          <button
            @click="deleteProduct"
            :disabled="deleting"
            class="px-6 py-3 bg-red-500 text-white text-sm font-medium rounded-lg shadow-sm hover:bg-red-600 transform transition-all duration-200 hover:scale-105 active:scale-95 hover:shadow-md disabled:opacity-50 disabled:hover:scale-100 group"
          >
            <span v-if="!deleting" class="flex items-center">
              <TrashIcon class="h-4 w-4 mr-2 transition-transform duration-200 group-hover:scale-110" />
              Yes, remove it
            </span>
            <span v-else class="flex items-center">
              <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Working on it...
            </span>
          </button>
        </div>
        
        <!-- Reassuring Note -->
        <p class="text-xs text-gray-500 mt-4">
          💡 Don't worry - you can always reactivate this product later
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  ChevronRightIcon,
  BuildingOfficeIcon,
  PencilIcon,
  TrashIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  UserGroupIcon,
  PresentationChartLineIcon,
  TrophyIcon,
  ChartBarIcon,
  PlusIcon,
  ClockIcon,
  CurrencyDollarIcon,
  DocumentTextIcon,
  CalendarDaysIcon,
  EyeIcon,
  InformationCircleIcon
} from '@heroicons/vue/24/outline'
import { useProductStore } from '@/stores/productStore'
import type { Product, ProductCategory } from '@/types/products'
import type { PrincipalProductPerformance } from '@/services/principalActivityApi'
import { CATEGORY_COLORS, CATEGORY_ICONS } from '@/types/products'

/**
 * Product Detail View
 * Display comprehensive information about a single product
 */

const route = useRoute()
const router = useRouter()
const productStore = useProductStore()

// Get product ID from route params
const productId = route.params.id as string

// State
const loading = ref(false)
const error = ref<string | null>(null)
const showDeleteModal = ref(false)
const deleting = ref(false)
const loadingPrincipals = ref(false)
const principalRelationships = ref<PrincipalProductPerformance[]>([])

// Delightful loading messages
const loadingMessages = [
  "Gathering product insights...",
  "Analyzing principal relationships...",
  "Calculating performance metrics...",
  "Preparing your dashboard...",
  "Almost there! Polishing the details...",
  "Connecting the dots...",
  "Loading the good stuff...",
  "Just a moment while we work our magic..."
]

const currentLoadingMessage = ref(0)
let loadingMessageInterval: number | null = null

// Computed
const product = computed<Product | null>(() => productStore.selectedProduct)

const createOpportunityRoute = computed(() => {
  if (!product.value) return '/opportunities/new'
  
  const queryParams = new URLSearchParams({
    contextType: 'product',
    productId: product.value.id,
    productName: product.value.name
  })
  
  return `/opportunities/new?${queryParams.toString()}`
})

const totalOpportunities = computed(() => {
  return principalRelationships.value.reduce((sum, rel) => 
    sum + (rel.opportunities_for_product || 0), 0
  )
})

const wonOpportunities = computed(() => {
  return principalRelationships.value.reduce((sum, rel) => 
    sum + (rel.won_opportunities_for_product || 0), 0
  )
})

const winRate = computed(() => {
  return totalOpportunities.value > 0 
    ? Math.round((wonOpportunities.value / totalOpportunities.value) * 100)
    : 0
})

// Methods
const startLoadingMessageCycle = () => {
  currentLoadingMessage.value = 0
  loadingMessageInterval = window.setInterval(() => {
    currentLoadingMessage.value = (currentLoadingMessage.value + 1) % loadingMessages.length
  }, 2000)
}

const stopLoadingMessageCycle = () => {
  if (loadingMessageInterval) {
    clearInterval(loadingMessageInterval)
    loadingMessageInterval = null
  }
}

const loadProduct = async () => {
  loading.value = true
  error.value = null
  startLoadingMessageCycle()
  
  try {
    await productStore.fetchProductById(productId)
    
    if (!product.value) {
      error.value = 'Product not found'
    } else {
      await loadPrincipalRelationships()
    }
  } catch (err) {
    console.error('Error loading product:', err)
    error.value = 'Failed to load product. Please try again.'
  } finally {
    loading.value = false
    stopLoadingMessageCycle()
  }
}

const loadPrincipalRelationships = async () => {
  if (!product.value) return
  
  loadingPrincipals.value = true
  
  try {
    // Mock principal relationships for now
    // In a real implementation, this would call an API to get principal-product relationships
    principalRelationships.value = [
      {
        principal_id: 'principal-1',
        principal_name: 'Acme Foods',
        product_id: product.value.id,
        product_name: product.value.name,
        product_category: product.value.category,
        product_sku: product.value.sku,
        is_primary_principal: true,
        exclusive_rights: false,
        wholesale_price: 150,
        minimum_order_quantity: 100,
        lead_time_days: 14,
        contract_start_date: '2024-01-01T00:00:00Z',
        contract_end_date: '2024-12-31T23:59:59Z',
        territory_restrictions: null,
        opportunities_for_product: 12,
        won_opportunities_for_product: 8,
        active_opportunities_for_product: 2,
        latest_opportunity_date: new Date().toISOString(),
        avg_opportunity_probability: 75,
        total_opportunities: 12,
        win_rate: 67,
        total_value: 45000,
        interactions_for_product: 24,
        recent_interactions_for_product: 3,
        last_interaction_date: new Date().toISOString(),
        product_is_active: product.value.is_active,
        launch_date: '2023-06-01T00:00:00Z',
        discontinue_date: null,
        unit_cost: 100,
        suggested_retail_price: 249,
        contract_status: 'ACTIVE',
        product_performance_score: 85,
        relationship_created_at: '2024-01-01T00:00:00Z',
        relationship_updated_at: new Date().toISOString()
      },
      {
        principal_id: 'principal-2',
        principal_name: 'Global Distributors Inc',
        product_id: product.value.id,
        product_name: product.value.name,
        product_category: product.value.category,
        product_sku: product.value.sku,
        is_primary_principal: false,
        exclusive_rights: false,
        wholesale_price: 160,
        minimum_order_quantity: 50,
        lead_time_days: 10,
        contract_start_date: '2024-03-01T00:00:00Z',
        contract_end_date: '2025-02-28T23:59:59Z',
        territory_restrictions: 'West Coast Only',
        opportunities_for_product: 8,
        won_opportunities_for_product: 4,
        active_opportunities_for_product: 3,
        latest_opportunity_date: new Date().toISOString(),
        avg_opportunity_probability: 65,
        total_opportunities: 8,
        win_rate: 50,
        total_value: 32000,
        interactions_for_product: 16,
        recent_interactions_for_product: 2,
        last_interaction_date: new Date().toISOString(),
        product_is_active: product.value.is_active,
        launch_date: '2023-06-01T00:00:00Z',
        discontinue_date: null,
        unit_cost: 100,
        suggested_retail_price: 269,
        contract_status: 'ACTIVE',
        product_performance_score: 72,
        relationship_created_at: '2024-03-01T00:00:00Z',
        relationship_updated_at: new Date().toISOString()
      }
    ]
  } catch (err) {
    console.error('Error loading principal relationships:', err)
  } finally {
    loadingPrincipals.value = false
  }
}

const confirmDelete = () => {
  showDeleteModal.value = true
}

const deleteProduct = async () => {
  if (!product.value) return
  
  try {
    deleting.value = true
    
    const success = await productStore.deleteProduct(product.value.id)

    if (success) {
      // Success - redirect to products list
      router.push('/products')
    } else {
      error.value = 'Failed to delete product'
      showDeleteModal.value = false
    }
  } catch (err) {
    console.error('Error deleting product:', err)
    error.value = 'An unexpected error occurred'
    showDeleteModal.value = false
  } finally {
    deleting.value = false
  }
}

// Utility functions
const getCategoryIcon = (category: ProductCategory | null): string => {
  if (!category) return '📦'
  return CATEGORY_ICONS[category] || '📦'
}

const getCategoryBadgeClasses = (category: ProductCategory | null): string => {
  if (!category) return 'bg-gray-100 text-gray-800'
  
  const color = CATEGORY_COLORS[category] || 'gray'
  const colorClasses: Record<string, string> = {
    red: 'bg-red-100 text-red-800',
    orange: 'bg-orange-100 text-orange-800',
    green: 'bg-green-100 text-green-800',
    blue: 'bg-blue-100 text-blue-800',
    yellow: 'bg-yellow-100 text-yellow-800',
    cyan: 'bg-cyan-100 text-cyan-800',
    purple: 'bg-purple-100 text-purple-800',
    pink: 'bg-pink-100 text-pink-800',
    gray: 'bg-gray-100 text-gray-800'
  }
  
  return colorClasses[color] || colorClasses.gray
}

const formatPrice = (price: number): string => {
  return price.toFixed(2)
}

const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

// Lifecycle
onMounted(() => {
  loadProduct()
})

onUnmounted(() => {
  stopLoadingMessageCycle()
})
</script>

<style scoped>
/* Page Entry Animations */
@keyframes fade-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes slide-up {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slide-left {
  from {
    opacity: 0;
    transform: translateX(20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes slide-right {
  from {
    opacity: 0;
    transform: translateX(-20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes modal-slide-up {
  from {
    opacity: 0;
    transform: translateY(50px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes page-enter {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes progress-fill {
  from {
    width: 0%;
  }
}

@keyframes number-count-up {
  from {
    transform: translateY(10px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

@keyframes pulse-gentle {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.8;
  }
}

@keyframes ping-slow {
  0% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.1);
    opacity: 0.7;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

/* Animation Classes */
.animate-fade-in {
  animation: fade-in 0.5s ease-out forwards;
}

.animate-slide-up {
  opacity: 0;
  animation: slide-up 0.6s ease-out forwards;
}

.animate-slide-left {
  opacity: 0;
  animation: slide-left 0.6s ease-out forwards;
}

.animate-slide-right {
  opacity: 0;
  animation: slide-right 0.6s ease-out forwards;
}

.animate-page-enter {
  animation: page-enter 0.8s ease-out forwards;
}

.animate-modal-slide-up {
  animation: modal-slide-up 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
}

.animate-progress-fill {
  animation: progress-fill 1.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
}

.animate-number-count {
  animation: number-count-up 0.8s ease-out forwards;
}

.animate-number-count-up {
  animation: number-count-up 1s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
}

.animate-pulse-gentle {
  animation: pulse-gentle 3s ease-in-out infinite;
}

.animate-ping-slow {
  animation: ping-slow 2s cubic-bezier(0, 0, 0.2, 1) infinite;
}

/* Hover Enhancements */
@media (prefers-reduced-motion: no-preference) {
  .group:hover .group-hover\:scale-110 {
    transform: scale(1.1);
  }
  
  .group:hover .group-hover\:scale-125 {
    transform: scale(1.25);
  }
  
  .group:hover .group-hover\:rotate-6 {
    transform: rotate(6deg);
  }
  
  .group:hover .group-hover\:rotate-12 {
    transform: rotate(12deg);
  }
  
  .group:hover .group-hover\:rotate-90 {
    transform: rotate(90deg);
  }
  
  .group:hover .group-hover\:rotate-180 {
    transform: rotate(180deg);
  }
  
  .group:hover .group-hover\:-translate-x-1 {
    transform: translateX(-0.25rem);
  }
  
  .group:hover .group-hover\:translate-x-1 {
    transform: translateX(0.25rem);
  }
}

/* Accessibility: Respect reduced motion */
@media (prefers-reduced-motion: reduce) {
  *,
  ::before,
  ::after {
    animation-delay: -1ms !important;
    animation-duration: 1ms !important;
    animation-iteration-count: 1 !important;
    background-attachment: initial !important;
    scroll-behavior: auto !important;
    transition-duration: 0s !important;
    transition-delay: 0s !important;
  }
}

/* Focus Enhancements */
.focus\:ring-2:focus {
  outline: 2px solid transparent;
  outline-offset: 2px;
  box-shadow: var(--tw-ring-inset) 0 0 0 calc(2px + var(--tw-ring-offset-width)) var(--tw-ring-color);
}

/* Button Active States */
.active\:scale-95:active {
  transform: scale(0.95);
}

/* Custom Gradient Backgrounds */
.bg-gradient-to-br {
  background-image: linear-gradient(to bottom right, var(--tw-gradient-stops));
}

.bg-gradient-to-r {
  background-image: linear-gradient(to right, var(--tw-gradient-stops));
}

/* Performance Optimization */
* {
  transform-style: preserve-3d;
  backface-visibility: hidden;
}

/* Loading State Enhancements */
.animate-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* Number Counter Animation Enhancement */
.animate-number-count span {
  display: inline-block;
  animation: number-count-up 0.6s ease-out forwards;
}

/* Progress Bar Animation */
.animate-progress-fill:hover {
  filter: brightness(1.1);
}
</style>