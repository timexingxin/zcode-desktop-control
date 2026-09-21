export interface PlatformCapabilities {
  platform: "darwin" | "win32" | "linux" | string;
  status: "implemented" | "partial" | "experimental" | "unsupported";
  pointer: {
    move: boolean;
    click_semantic: boolean;
    click_coordinate: boolean;
    drag: boolean;
    scroll: boolean;
    buttons: ("left" | "right" | "middle")[];
    multi_click: boolean;
  };
  keyboard: {
    type_text: boolean;
    press_key: boolean;
    hotkey: boolean;
  };
  accessibility: {
    inspect_tree: boolean;
    stable_handles: boolean;
    semantic_actions: boolean;
    set_value: boolean;
  };
  window: {
    list: boolean;
    focus: boolean;
    move: boolean;
    resize: boolean;
    minimize: boolean;
    maximize: boolean;
  };
  clipboard: {
    read: boolean;
    write: boolean;
  };
  screen: {
    screenshot: boolean;
    multi_display_info: boolean;
  };
  control: {
    kill_switch: boolean;
  };
}

export function getPlatformCapabilities(platform: string = process.platform): PlatformCapabilities {
  if (platform === "darwin") {
    return {
      platform: "darwin",
      status: "partial",
      pointer: {
        move: true,
        click_semantic: true,
        click_coordinate: true,
        drag: true,
        scroll: true,
        buttons: ["left", "right", "middle"],
        multi_click: true,
      },
      keyboard: {
        type_text: true,
        press_key: true,
        hotkey: true,
      },
      accessibility: {
        inspect_tree: true,
        stable_handles: true,
        semantic_actions: true,
        set_value: true,
      },
      window: {
        list: true,
        focus: true,
        move: true,
        resize: true,
        minimize: true,
        maximize: true,
      },
      clipboard: {
        read: true,
        write: true,
      },
      screen: {
        screenshot: true,
        multi_display_info: true,
      },
      control: {
        kill_switch: true,
      },
    };
  }

  if (platform === "win32") {
    return {
      platform: "win32",
      status: "experimental",
      pointer: {
        move: false,
        click_semantic: false,
        click_coordinate: false,
        drag: false,
        scroll: false,
        buttons: [],
        multi_click: false,
      },
      keyboard: {
        type_text: false,
        press_key: false,
        hotkey: false,
      },
      accessibility: {
        inspect_tree: false,
        stable_handles: false,
        semantic_actions: false,
        set_value: false,
      },
      window: {
        list: false,
        focus: false,
        move: false,
        resize: false,
        minimize: false,
        maximize: false,
      },
      clipboard: {
        read: false,
        write: false,
      },
      screen: {
        screenshot: false,
        multi_display_info: false,
      },
      control: {
        kill_switch: false,
      },
    };
  }

  // linux or other platforms
  return {
    platform,
    status: "experimental",
    pointer: {
      move: false,
      click_semantic: false,
      click_coordinate: false,
      drag: false,
      scroll: false,
      buttons: [],
      multi_click: false,
    },
    keyboard: {
      type_text: false,
      press_key: false,
      hotkey: false,
    },
    accessibility: {
      inspect_tree: false,
      stable_handles: false,
      semantic_actions: false,
      set_value: false,
    },
    window: {
      list: false,
      focus: false,
      move: false,
      resize: false,
      minimize: false,
      maximize: false,
    },
    clipboard: {
      read: false,
      write: false,
    },
    screen: {
      screenshot: false,
      multi_display_info: false,
    },
    control: {
      kill_switch: false,
    },
  };
}
