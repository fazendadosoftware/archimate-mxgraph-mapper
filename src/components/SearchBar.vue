<template>
  <div
    class="w-full rounded-md border relative py-2 pl-7 pr-6 text-xs"
    :class="{
      'cursor-not-allowed': disabled,
      'cursor-text': !disabled
    }"
    @click="input?.focus()">
    <span
      class="absolute top-1/2 left-1 transform -translate-y-1/2 transition-colors"
      :class="{
        'text-gray-500': isFocused || modelValue !== '',
        'text-gray-300': false
      }">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path fill-rule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clip-rule="evenodd" />
      </svg>
    </span>
    <input
      ref="input"
      :value="modelValue"
      :disabled="disabled"
      class="w-full outline-none cursor-text"
      :class="{
        'cursor-not-allowed': disabled
      }"
      :placeholder="placeholder"
      @input="(evt: any) => emit('update:modelValue', evt?.target?.value)"
      @focus="isFocused = true"
      @focusout="isFocused = false">
    <transition
      enter-from-class="opacity-0"
      enter-active-class="transition-opacity"
      enter-to-class="opacity-100"
      leave-from-class="opacity-100"
      leave-active-class="transition-opacity"
      leave-to-class="opacity-0"
    >
      <span
        v-if="modelValue"
        class="absolute top-1/2 right-1 transform -translate-y-1/2 cursor-pointer text-gray-500 transition-colors rounded-full p-1 -mx-1"
        @click.stop="emit('update:modelValue', '')">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
        </svg>
      </span>
    </transition>
  </div>
</template>

<script lang="ts" setup>
import { ref, Ref } from 'vue'

const emit = defineEmits<{(e: 'update:modelValue', modelValue: string): void}>()

const props = withDefaults(
  defineProps<{ modelValue?: string, refreshing?: boolean, placeholder?: string, disabled?: boolean }>(),
  { placeholder: 'Search' }
)

const input: Ref<HTMLElement | null> = ref(null)
const isFocused = ref(false)
</script>
