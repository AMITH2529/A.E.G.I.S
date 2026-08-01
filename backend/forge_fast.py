import asyncio
import os

try:
    import torch
    from shap_e.diffusion.sample import sample_latents
    from shap_e.diffusion.gaussian_diffusion import diffusion_from_config
    from shap_e.models.download import load_model, load_config
    from shap_e.util.notebooks import decode_latent_mesh
    HAS_SHAPE = True
except ImportError:
    HAS_SHAPE = False
    print("Shap-E is not installed. Running in mock mode.")

class ShapEForge:
    def __init__(self):
        self.device = None
        self.xm = None
        self.model = None
        self.diffusion = None
        
    def load_models(self):
        if not HAS_SHAPE:
            return
        self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        print(f"Loading Shap-E models onto {self.device}...")
        self.xm = load_model('transmitter', device=self.device)
        self.model = load_model('text300M', device=self.device)
        self.diffusion = diffusion_from_config(load_config('diffusion'))
        print("Shap-E Models loaded.")

    async def generate_mesh(self, prompt: str, output_path: str):
        if not HAS_SHAPE:
            print(f"[MOCK] Forging {prompt}...")
            await asyncio.sleep(2)
            # Create a mock file
            os.makedirs(os.path.dirname(output_path), exist_ok=True)
            with open(output_path, 'w') as f:
                f.write("mock")
            return output_path

        if not self.model:
            self.load_models()
            
        print(f"Forging: '{prompt}'...")
        batch_size = 1
        guidance_scale = 15.0

        # Note: In a real async server, this heavy computation should be run in a ProcessPoolExecutor
        # to avoid blocking the main asyncio event loop.
        def run_inference():
            latents = sample_latents(
                batch_size=batch_size,
                model=self.model,
                diffusion=self.diffusion,
                guidance_scale=guidance_scale,
                model_kwargs=dict(texts=[prompt] * batch_size),
                progress=True,
                clip_denoised=True,
                use_fp16=True,
                use_karras=True,
                karras_steps=64,
                sigma_min=1e-3,
                sigma_max=160,
                s_churn=0,
            )
            return decode_latent_mesh(self.xm, latents[0]).triMesh()

        loop = asyncio.get_event_loop()
        mesh = await loop.run_in_executor(None, run_inference)
        
        # Save as OBJ
        obj_path = output_path.replace(".glb", ".obj")
        os.makedirs(os.path.dirname(obj_path), exist_ok=True)
        with open(obj_path, 'w') as f:
            mesh.write_obj(f)
            
        print(f"Mesh saved to {obj_path}")
        return obj_path

forge_engine = ShapEForge()
