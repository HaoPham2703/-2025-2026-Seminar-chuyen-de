# 设置说明

## 安装依赖

在整合这些组件后，您需要安装以下依赖：

```bash
cd codeZoneMobile
npm install
```

## 已添加的依赖

以下依赖已添加到 `package.json`：

- `nativewind`: Tailwind CSS for React Native
- `tailwindcss`: Tailwind CSS 核心库
- `autoprefixer`: CSS 自动前缀
- `postcss`: CSS 后处理器
- `framer-motion`: 动画库（用于 Web 支持）
- `lucide-react-native`: 图标库
- `react-native-svg`: SVG 支持（lucide-react-native 需要）

## 配置说明

1. **Tailwind CSS**: 已配置 `tailwind.config.ts`
2. **PostCSS**: 已配置 `postcss.config.js`
3. **Babel**: 已配置 `babel.config.js` 以支持 NativeWind
4. **全局样式**: 已创建 `global.css` 包含设计系统变量
5. **TypeScript**: 已创建 `nativewind-env.d.ts` 支持类型定义

## 组件位置

所有组件已放置在 `src/components/` 目录：

- `ClockButton.tsx` - 打卡按钮组件
- `ConfirmModal.tsx` - 确认弹窗组件
- `LocationStatus.tsx` - 位置状态组件
- `TimeStats.tsx` - 时间统计组件
- `StatusNotification.tsx` - 状态通知组件
- `Index.tsx` - 主页面组件

## 使用

主页面 (`app/(tabs)/index.tsx`) 已更新为使用新的组件。

运行项目：

```bash
npx expo start
```

或者使用 npm 脚本：

```bash
npm start
```

然后选择运行平台（iOS、Android 或 Web）。

也可以直接指定平台：

```bash
npx expo start --ios      # iOS 模拟器
npx expo start --android  # Android 模拟器
npx expo start --web       # Web 浏览器
```

## 注意事项

1. NativeWind 使用 className 属性，与 Web 的 Tailwind CSS 类似
2. 某些 Web 特定的 CSS 功能可能需要在 React Native 中使用替代方案
3. 颜色使用 HSL 格式，定义在 `global.css` 中

