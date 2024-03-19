<script setup lang="ts">
import {ref} from "vue";
import {app} from "@tauri-apps/api";
import {invoke} from "@tauri-apps/api/tauri";
import {windows, WinType} from "../windows";
import {WebviewWindow} from "@tauri-apps/api/window";
import {trace, info, error} from "tauri-plugin-log-api";


const greetMsg = ref("");
const name = ref("");

async function greet() {
  // Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
  greetMsg.value = await invoke("greet", {name: name.value});
}

let baidu: Promise<WebviewWindow>;

function openBaidu() {
  for (let i = 0; i < 100; i++) {
    trace('trace ==》 click openBaidu')
    info('info ==》 click openBaidu')
    error('error ==》 click openBaidu')
  }
  baidu = windows.createWin(WinType.BAIDU);
  baidu.then(o => {
    o.show();
  })
  console.log(baidu)
}

function closeBaidu() {
  baidu?.then(o => {
    o.close();
  })
}

const version = ref('')
app.getVersion().then(ver => {
  version.value = ver
})

</script>

<template>
  <form class="row" @submit.prevent="greet">
    <input id="greet-input" v-model="name" placeholder="Enter a name..."/>
    <button type="submit">Greet</button>
  </form>

  <p>{{ greetMsg }}</p>
  <p>V{{version}}</p>
  <button @click="openBaidu" id="openBaidu">打开百度</button>
  <button @click="closeBaidu">关闭百度</button>
</template>
