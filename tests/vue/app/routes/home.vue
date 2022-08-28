<script setup>
import { ref } from 'vue';
import { set_route_config } from 'moku-vue';

const count = ref(5);

set_route_config({ hydrate: true });
</script>

<template>
	<button @click="count--">-</button>
	<span>{{ count }}</span>
	<button @click="count++">+</button>
</template>
