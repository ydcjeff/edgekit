<script setup>
import { ref } from 'vue';

const count = ref(5);
</script>

<template>
	<button @click="count--">-</button>
	<span>{{ count }}</span>
	<button @click="count++">+</button>
</template>
