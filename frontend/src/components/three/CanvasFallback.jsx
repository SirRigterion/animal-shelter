// src/components/three/CanvasFallback.jsx
// Если WebGL недоступен или сцена упала - показываем заглушку (например, фото питомца)

import { Component } from "react";

export default class CanvasFallback extends Component {
  constructor(props) {
    super(props);
    this.state = { failed: false };
  }

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error) {
    console.warn("3D-сцена недоступна, показана заглушка:", error);
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}
