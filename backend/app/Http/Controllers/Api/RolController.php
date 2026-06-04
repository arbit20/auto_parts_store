<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\RolResource;
use App\Models\Rol;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class RolController extends Controller
{
    public function index(): AnonymousResourceCollection
    {
        return RolResource::collection(
            Rol::query()->orderBy('nombre')->get(),
        );
    }
}
