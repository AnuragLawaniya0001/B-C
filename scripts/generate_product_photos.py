import os
from PIL import Image

def main():
    gears_im = Image.open('frontend/public/images/collections/gears.jpg')
    apparel_im = Image.open('frontend/public/images/collections/apparel.jpg')
    fitness_im = Image.open('frontend/public/images/collections/fitness.jpg')
    exclusive_im = Image.open('frontend/public/images/collections/exclusive.jpg')

    w, h = 1024, 1024

    crops = {
        # English Willow Cricket Bat (Center & Left blade)
        'prod_bb5773fb3301.jpg': gears_im.crop((50, 100, 750, 800)),
        # Football Size 5 Match Ball (Bottom Right ball)
        'prod_615e0bf0fe1b.jpg': gears_im.crop((450, 460, 820, 830)),
        # Cricket Ball Leather (Bottom Left red ball)
        'prod_a388a58ade26.jpg': gears_im.crop((280, 650, 480, 850)),
        # Badminton Racket Carbon Pro (Top Right racket head)
        'prod_5c6a0e7b3536.jpg': gears_im.crop((550, 200, 920, 570)),

        # Running Shoes Pro Velocity (Bottom Left shoes)
        'prod_04d47c2d2d11.jpg': apparel_im.crop((120, 410, 500, 640)),
        # Football Studs Traction Grip
        'prod_4ba0bc9216bc.jpg': apparel_im.crop((120, 410, 500, 640)),
        # Tracksuit Sports All-Weather (Folded technical activewear)
        'prod_94b10d66f325.jpg': apparel_im.crop((490, 390, 930, 640)),
        # Compression T-Shirt Base Layer
        'prod_62dd8e5ca7fd.jpg': apparel_im.crop((490, 390, 810, 630)),
        # Sports Jersey Cricket DryFit
        'prod_7f6c3e643cad.jpg': apparel_im.crop((500, 390, 930, 640)),
        # Football Jersey Training Edition
        'prod_b7f3cf8049cd.jpg': apparel_im.crop((600, 400, 930, 640)),

        # Dumbbell Set 5kg Cast Iron (Bottom Left dumbbells)
        'prod_143c4a82bb5c.jpg': fitness_im.crop((110, 550, 420, 810)),
        # Yoga Mat Premium Eco Grip (Rolled yoga mat)
        'prod_887dc8597e67.jpg': fitness_im.crop((410, 560, 780, 790)),
        # Sports Water Bottle 1L Insulated (Steel water bottle)
        'prod_960edf2b2f46.jpg': fitness_im.crop((630, 510, 740, 780)),
        # Skipping Rope Pro Speed Bearing (Speed jump rope)
        'prod_6a0af6341702.jpg': fitness_im.crop((680, 730, 920, 840)),

        # Cookey / Exclusive Club Pass
        'prod_fe5ead8e6052.jpg': exclusive_im.crop((150, 180, 880, 750)),
    }

    dst_dirs = [
        'frontend/public/uploads/products',
        'backend/uploads/products'
    ]

    for filename, cropped in crops.items():
        # Square pad or resize to 600x600 for sharp catalog look
        max_dim = max(cropped.size)
        square = Image.new('RGB', (max_dim, max_dim), (248, 250, 252))
        offset = ((max_dim - cropped.size[0]) // 2, (max_dim - cropped.size[1]) // 2)
        square.paste(cropped, offset)
        resized = square.resize((600, 600), Image.Resampling.LANCZOS)

        for d in dst_dirs:
            os.makedirs(d, exist_ok=True)
            p = os.path.join(d, filename)
            resized.save(p, 'JPEG', quality=92)
        print(f"Generated product photo: {filename} (600x600)")

if __name__ == '__main__':
    main()
