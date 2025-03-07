<script setup>
import { ref } from 'vue'

const emit = defineEmits(['submit', 'cancel'])

// 表单数据模型
const formData = ref({
  MIN: '',
  FGM: '',
  FGA: '',
  threePM: '',
  threePA: '',
  FTM: '',
  FTA: '',
  OREB: '',
  DREB: '',
  AST: '',
  TOV: '',
  STL: '',
  BLK: '',
  PF: ''
})

// 验证规则
const errors = ref({})

const validateField = (field, value) => {
  const numValue = Number(value)
  errors.value[field] = ''

  if (value === '') {
    errors.value[field] = '必填字段'
    return false
  }

  if (isNaN(numValue) || numValue < 0) {
    errors.value[field] = '必须为大于等于0的数字'
    return false
  }

  // 特殊字段验证
  switch (field) {
    case 'FGM':
      if (numValue > Number(formData.value.FGA)) {
        errors.value[field] = '命中数不能超过出手数'
        return false
      }
      break
    case 'threePM':
      if (numValue > Number(formData.value.threePA)) {
        errors.value[field] = '三分命中数不能超过出手数'
        return false
      }
      break
    case 'FTM':
      if (numValue > Number(formData.value.FTA)) {
        errors.value[field] = '罚球命中数不能超过出手数'
        return false
      }
      break
  }

  return true
}

const handleSubmit = () => {
  let isValid = true
  const fields = Object.keys(formData.value)

  // 执行整体验证
  fields.forEach(field => {
    if (!validateField(field, formData.value[field])) {
      isValid = false
    }
  })

  if (!isValid) return

  // 转换数字类型
  const record = {}
  Object.entries(formData.value).forEach(([key, value]) => {
    record[key] = Number(value)
  })

  emit('submit', record)
  // 清空表单
  formData.value = Object.fromEntries(
    Object.keys(formData.value).map(key => [key, ''])
  )
}
</script>

<template>
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
    <div class="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
      <h3 class="text-xl font-bold mb-4">添加比赛记录</h3>

      <form @submit.prevent="handleSubmit" class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <!-- 时间相关 -->
        <div class="space-y-2">
          <label class="block">
            <span class="text-gray-700">上场时间（分钟）</span>
            <input v-model.number="formData.MIN" type="number" min="0" class="mt-1 block w-full rounded border-gray-300"
              :class="{ 'border-red-500': errors.MIN }" @blur="validateField('MIN', formData.MIN)" />
            <span v-if="errors.MIN" class="text-red-500 text-sm">{{ errors.MIN }}</span>
          </label>
        </div>

        <!-- 投篮数据 -->
        <div class="space-y-2">
          <label class="block">
            <span class="text-gray-700">投篮命中（FGM）</span>
            <input v-model.number="formData.FGM" type="number" min="0" class="mt-1 block w-full rounded border-gray-300"
              :class="{ 'border-red-500': errors.FGM }" @blur="validateField('FGM', formData.FGM)" />
            <span v-if="errors.FGM" class="text-red-500 text-sm">{{ errors.FGM }}</span>
          </label>

          <label class="block">
            <span class="text-gray-700">投篮出手（FGA）</span>
            <input v-model.number="formData.FGA" type="number" min="0" class="mt-1 block w-full rounded border-gray-300"
              :class="{ 'border-red-500': errors.FGA }" @blur="validateField('FGA', formData.FGA)" />
            <span v-if="errors.FGA" class="text-red-500 text-sm">{{ errors.FGA }}</span>
          </label>
        </div>

        <!-- 三分数据 -->
        <div class="space-y-2">
          <label class="block">
            <span class="text-gray-700">三分命中</span>
            <input v-model.number="formData.threePM" type="number" min="0"
              class="mt-1 block w-full rounded border-gray-300" :class="{ 'border-red-500': errors.threePM }"
              @blur="validateField('threePM', formData.threePM)" />
            <span v-if="errors.threePM" class="text-red-500 text-sm">{{ errors.threePM }}</span>
          </label>

          <label class="block">
            <span class="text-gray-700">三分出手</span>
            <input v-model.number="formData.threePA" type="number" min="0"
              class="mt-1 block w-full rounded border-gray-300" :class="{ 'border-red-500': errors.threePA }"
              @blur="validateField('threePA', formData.threePA)" />
            <span v-if="errors.threePA" class="text-red-500 text-sm">{{ errors.threePA }}</span>
          </label>
        </div>

        <!-- 罚球数据 -->
        <div class="space-y-2">
          <label class="block">
            <span class="text-gray-700">罚球命中（FTM）</span>
            <input v-model.number="formData.FTM" type="number" min="0" class="mt-1 block w-full rounded border-gray-300"
              :class="{ 'border-red-500': errors.FTM }" @blur="validateField('FTM', formData.FTM)" />
            <span v-if="errors.FTM" class="text-red-500 text-sm">{{ errors.FTM }}</span>
          </label>

          <label class="block">
            <span class="text-gray-700">罚球出手（FTA）</span>
            <input v-model.number="formData.FTA" type="number" min="0" class="mt-1 block w-full rounded border-gray-300"
              :class="{ 'border-red-500': errors.FTA }" @blur="validateField('FTA', formData.FTA)" />
            <span v-if="errors.FTA" class="text-red-500 text-sm">{{ errors.FTA }}</span>
          </label>
        </div>

        <!-- 其他数据 -->
        <div class="space-y-2">
          <label class="block">
            <span class="text-gray-700">进攻篮板（OREB）</span>
            <input v-model.number="formData.OREB" type="number" min="0"
              class="mt-1 block w-full rounded border-gray-300" :class="{ 'border-red-500': errors.OREB }"
              @blur="validateField('OREB', formData.OREB)" />
            <span v-if="errors.OREB" class="text-red-500 text-sm">{{ errors.OREB }}</span>
          </label>

          <label class="block">
            <span class="text-gray-700">防守篮板（DREB）</span>
            <input v-model.number="formData.DREB" type="number" min="0"
              class="mt-1 block w-full rounded border-gray-300" :class="{ 'border-red-500': errors.DREB }"
              @blur="validateField('DREB', formData.DREB)" />
            <span v-if="errors.DREB" class="text-red-500 text-sm">{{ errors.DREB }}</span>
          </label>
        </div>

        <div class="space-y-2">
          <label class="block">
            <span class="text-gray-700">助攻（AST）</span>
            <input v-model.number="formData.AST" type="number" min="0" class="mt-1 block w-full rounded border-gray-300"
              :class="{ 'border-red-500': errors.AST }" @blur="validateField('AST', formData.AST)" />
            <span v-if="errors.AST" class="text-red-500 text-sm">{{ errors.AST }}</span>
          </label>

          <label class="block">
            <span class="text-gray-700">失误（TOV）</span>
            <input v-model.number="formData.TOV" type="number" min="0" class="mt-1 block w-full rounded border-gray-300"
              :class="{ 'border-red-500': errors.TOV }" @blur="validateField('TOV', formData.TOV)" />
            <span v-if="errors.TOV" class="text-red-500 text-sm">{{ errors.TOV }}</span>
          </label>
        </div>

        <div class="space-y-2">
          <label class="block">
            <span class="text-gray-700">抢断（STL）</span>
            <input v-model.number="formData.STL" type="number" min="0" class="mt-1 block w-full rounded border-gray-300"
              :class="{ 'border-red-500': errors.STL }" @blur="validateField('STL', formData.STL)" />
            <span v-if="errors.STL" class="text-red-500 text-sm">{{ errors.STL }}</span>
          </label>

          <label class="block">
            <span class="text-gray-700">盖帽（BLK）</span>
            <input v-model.number="formData.BLK" type="number" min="0" class="mt-1 block w-full rounded border-gray-300"
              :class="{ 'border-red-500': errors.BLK }" @blur="validateField('BLK', formData.BLK)" />
            <span v-if="errors.BLK" class="text-red-500 text-sm">{{ errors.BLK }}</span>
          </label>
        </div>

        <div class="space-y-2">
          <label class="block">
            <span class="text-gray-700">犯规（PF）</span>
            <input v-model.number="formData.PF" type="number" min="0" class="mt-1 block w-full rounded border-gray-300"
              :class="{ 'border-red-500': errors.PF }" @blur="validateField('PF', formData.PF)" />
            <span v-if="errors.PF" class="text-red-500 text-sm">{{ errors.PF }}</span>
          </label>
        </div>

        <!-- 操作按钮 -->
        <div class="md:col-span-2 flex justify-end gap-2 mt-4">
          <button type="button" @click="$emit('cancel')" class="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400">
            取消
          </button>
          <button type="submit" class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
            提交记录
          </button>
        </div>
      </form>
    </div>
  </div>
</template>
