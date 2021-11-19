export const mobileGridSize = (number: number) => {
  switch (number) {
    case 1:
      return {
        height: `${window.innerHeight}px`,
        sizes: [12],
      };
    case 2:
      return {
        height: `${(window.innerHeight) / 2}px`,
        sizes: [12, 12],
      };
    case 3:
      return {
        height: `${(window.innerHeight) / 2}px`,
        sizes: [6, 6, 12],
      };
    case 4:
      return {
        height: `${(window.innerHeight) / 2}px`,
        sizes: [6, 6, 6, 6],
      };
    case 5:
      return {
        height: `${(window.innerWidth) / 3}px`,
        sizes: [6, 6, 6, 6, 12],
      };
    case 6:
      return {
        height: `${(window.innerWidth) / 3}px`,
        sizes: [6, 6, 6, 6, 6, 6],
      };
    case 7:
      return {
        height: `${(window.innerWidth) / 4}px`,
        sizes: [6, 6, 6, 6, 6, 6, 12],
      };
    case 8:
      return {
        height: `${(window.innerWidth) / 4}px`,
        sizes: [6, 6, 6, 6, 6, 6, 6, 6],
      };
    case 9:
      return {
        height: `${(window.innerWidth) / 5}px`,
        sizes: [6, 6, 6, 6, 6, 6, 6, 6, 6],
      };
    default:
      return {
        height: `${(window.innerWidth) / 5}px`,
        sizes: [6, 6, 6, 6, 6, 6, 6, 6, 6, 6],
      };
  }
};

export const desktopGridSize = (number: number) => {
  switch (number) {
    case 1:
      return {
        height: `${window.innerHeight}px`,
        sizes: [12],
      };
    case 2:
      return {
        height: `${window.innerHeight}px`,
        sizes: [6, 6],
      };
    case 3:
      return {
        height: `${(window.innerHeight) / 2}px`,
        sizes: [6, 6, 6],
      };
    case 4:
      return {
        height: `${(window.innerHeight) / 2}px`,
        sizes: [6, 6, 6, 6],
      };
    case 5:
      return {
        height: `${(window.innerHeight) / 2}px`,
        sizes: [4, 4, 4, 6, 6],
      };
    case 6:
      return {
        height: `${(window.innerHeight) / 2}px`,
        sizes: [4, 4, 4, 4, 4, 4],
      };
    case 7:
      return {
        height: `${(window.innerHeight) / 2}px`,
        sizes: [3, 3, 3, 3, 4, 4, 4],
      };
    case 8:
      return {
        height: `${(window.innerHeight) / 2}px`,
        sizes: [3, 3, 3, 3, 3, 3, 3, 3],
      };
    case 9:
      return {
        height: `${(window.innerWidth) / 3}px`,
        sizes: [4, 4, 4, 4, 4, 4, 4, 4, 4],
      };
    default:
      return {
        height: `${(window.innerWidth) / 3}px`,
        sizes: [3, 3, 3, 3, 4, 4, 4, 4, 4, 4],
      };
  }
};
