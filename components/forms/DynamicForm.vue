<script setup lang="ts">
import type { FormFieldDefinition } from "~/types";

const props = defineProps<{
  fields: FormFieldDefinition[];
  modelValue: Record<string, unknown>;
  loading?: boolean;
}>();

const emit = defineEmits<{
  "update:modelValue": [value: Record<string, unknown>];
  submit: [];
}>();

function updateField(name: string, value: unknown) {
  emit("update:modelValue", { ...props.modelValue, [name]: value });
}
</script>

<template>
  <form @submit.prevent="emit('submit')" class="space-y-4">
    <div v-for="field in fields" :key="field.name">
      <label :for="field.name" class="label">
        {{ field.label }}
        <span v-if="field.required" class="text-red-400">*</span>
      </label>

      <input
        v-if="
          field.type === 'text' ||
          field.type === 'email' ||
          field.type === 'number' ||
          field.type === 'date'
        "
        :id="field.name"
        :type="field.type"
        :placeholder="field.placeholder"
        :required="field.required"
        :value="modelValue[field.name]"
        class="input"
        @input="updateField(field.name, ($event.target as HTMLInputElement).value)"
      />

      <textarea
        v-else-if="field.type === 'textarea'"
        :id="field.name"
        :placeholder="field.placeholder"
        :required="field.required"
        :value="String(modelValue[field.name] ?? '')"
        class="input min-h-[80px]"
        @input="updateField(field.name, ($event.target as HTMLTextAreaElement).value)"
      />

      <select
        v-else-if="field.type === 'select'"
        :id="field.name"
        :required="field.required"
        :value="modelValue[field.name]"
        class="input"
        @change="updateField(field.name, ($event.target as HTMLSelectElement).value)"
      >
        <option value="">Select...</option>
        <option v-for="opt in field.options" :key="opt.value" :value="opt.value">
          {{ opt.label }}
        </option>
      </select>

      <label
        v-else-if="field.type === 'checkbox'"
        :for="field.name"
        class="flex items-center gap-2 cursor-pointer"
      >
        <input
          :id="field.name"
          type="checkbox"
          :checked="Boolean(modelValue[field.name])"
          class="h-4 w-4 rounded border-surface-600 bg-surface-800 text-brand-600"
          @change="updateField(field.name, ($event.target as HTMLInputElement).checked)"
        />
        <span class="text-sm text-surface-300">{{ field.label }}</span>
      </label>
    </div>

    <div class="flex justify-end gap-3 pt-4">
      <slot name="actions">
        <button type="submit" class="btn-primary" :disabled="loading">
          {{ loading ? "Saving..." : "Submit" }}
        </button>
      </slot>
    </div>
  </form>
</template>
