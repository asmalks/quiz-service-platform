// Generate colorful pastel avatar from name
export const getAvatarColor = (name: string): string => {
  const pastelColors = [
    'bg-pastel-pink',
    'bg-pastel-blue',
    'bg-pastel-purple',
    'bg-pastel-mint',
    'bg-pastel-yellow',
  ];
  
  // Generate consistent color based on name
  const charSum = name.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return pastelColors[charSum % pastelColors.length];
};

export const getInitials = (name: string): string => {
  const words = name.trim().split(' ');
  if (words.length >= 2) {
    return (words[0][0] + words[words.length - 1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
};
