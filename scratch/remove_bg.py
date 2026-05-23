import os
from PIL import Image

def make_transparent(img_path, output_path):
    print(f"Loading image from {img_path}...")
    img = Image.open(img_path)
    img = img.convert("RGBA")
    datas = img.getdata()

    newData = []
    # Let's count modified pixels
    modified_count = 0
    
    for item in datas:
        # Check if the pixel is white or very close to white
        # We can use a tolerance (e.g., if R, G, B are all > 240)
        if item[0] > 240 and item[1] > 240 and item[2] > 240:
            # Make it transparent
            newData.append((255, 255, 255, 0))
            modified_count += 1
        else:
            newData.append(item)

    img.putdata(newData)
    img.save(output_path, "PNG")
    print(f"Saved transparent image to {output_path}. Modified {modified_count} pixels.")

if __name__ == "__main__":
    src = r"c:\xampp\htdocs\project_lavirameal\assets\LOGO_LAVIRAMEAL.png"
    dest = r"c:\xampp\htdocs\project_lavirameal\assets\LOGO_LAVIRAMEAL_TRANSPARENT.png"
    make_transparent(src, dest)
